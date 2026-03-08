-- Backfill Classroom organization data for existing users.
--
-- Dry run recommendation:
--   BEGIN;
--   -- run this script
--   ROLLBACK;
--
-- Apply for real:
--   BEGIN;
--   -- run this script
--   COMMIT;
--
-- Prerequisite:
--   Run schema migrations first (including enum uppercase migration).

-- 1) Ensure one organization row per teacher email domain.
WITH teacher_domains AS (
    SELECT DISTINCT LOWER(SPLIT_PART(u."email", '@', 2)) AS domain
    FROM "classroomTeacherToken" tt
    INNER JOIN "user" u ON u."id" = tt."userId"
    WHERE u."email" IS NOT NULL
        AND POSITION('@' IN u."email") > 1
),
missing_domains AS (
    SELECT td.domain
    FROM teacher_domains td
    LEFT JOIN "organization" o ON o."domain" = td.domain
    WHERE o."id" IS NULL
)
INSERT INTO "organization" ("id", "domain", "name", "createdAt", "updatedAt")
SELECT
    CONCAT('org_', MD5(md.domain)) AS "id",
    md.domain AS "domain",
    md.domain AS "name",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM missing_domains md
ON CONFLICT ("domain") DO NOTHING;

-- 2) Seed missing teacher memberships as approved admins.
WITH teacher_orgs AS (
    SELECT DISTINCT
        tt."userId" AS "userId",
        o."id" AS "organizationId"
    FROM "classroomTeacherToken" tt
    INNER JOIN "user" u ON u."id" = tt."userId"
    INNER JOIN "organization" o ON o."domain" = LOWER(SPLIT_PART(u."email", '@', 2))
    WHERE u."email" IS NOT NULL
        AND POSITION('@' IN u."email") > 1
),
missing_teacher_memberships AS (
    SELECT
        to2."organizationId",
        to2."userId"
    FROM teacher_orgs to2
    LEFT JOIN "organizationUser" ou
        ON ou."organizationId" = to2."organizationId"
        AND ou."userId" = to2."userId"
    WHERE ou."id" IS NULL
)
INSERT INTO "organizationUser" (
    "id",
    "organizationId",
    "userId",
    "role",
    "status",
    "approvedByUserId",
    "approvedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('org_user_', MD5(mtm."organizationId" || ':' || mtm."userId")) AS "id",
    mtm."organizationId",
    mtm."userId",
    'ORG_ADMIN',
    'APPROVED',
    mtm."userId",
    NOW(),
    NOW(),
    NOW()
FROM missing_teacher_memberships mtm
ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- 3) Promote all connected teachers in their org to approved admins.
WITH teacher_orgs AS (
    SELECT DISTINCT
        tt."userId" AS "userId",
        o."id" AS "organizationId"
    FROM "classroomTeacherToken" tt
    INNER JOIN "user" u ON u."id" = tt."userId"
    INNER JOIN "organization" o ON o."domain" = LOWER(SPLIT_PART(u."email", '@', 2))
    WHERE u."email" IS NOT NULL
        AND POSITION('@' IN u."email") > 1
)
UPDATE "organizationUser" ou
SET
    "role" = 'ORG_ADMIN',
    "status" = 'APPROVED',
    "approvedByUserId" = COALESCE(ou."approvedByUserId", ou."userId"),
    "approvedAt" = COALESCE(ou."approvedAt", NOW()),
    "updatedAt" = NOW()
FROM teacher_orgs to2
WHERE ou."organizationId" = to2."organizationId"
    AND ou."userId" = to2."userId";

-- 4) Ensure each organization has at least one approved admin.
--    Defensive no-op when step 3 ran successfully.
WITH orgs_without_admin AS (
    SELECT o."id" AS "organizationId"
    FROM "organization" o
    WHERE NOT EXISTS (
        SELECT 1
        FROM "organizationUser" ou
        WHERE ou."organizationId" = o."id"
            AND ou."role" = 'ORG_ADMIN'
            AND ou."status" = 'APPROVED'
    )
),
admin_candidates AS (
    SELECT DISTINCT ON (owa."organizationId")
        ou."id" AS "membershipId",
        ou."userId" AS "userId"
    FROM orgs_without_admin owa
    INNER JOIN "organizationUser" ou
        ON ou."organizationId" = owa."organizationId"
        AND ou."status" = 'APPROVED'
        AND ou."role" IN ('TEACHER', 'ORG_ADMIN')
    INNER JOIN "classroomTeacherToken" tt ON tt."userId" = ou."userId"
    ORDER BY
        owa."organizationId",
        tt."createdAt" ASC NULLS LAST,
        ou."createdAt" ASC
)
UPDATE "organizationUser" ou
SET
    "role" = 'ORG_ADMIN',
    "status" = 'APPROVED',
    "approvedByUserId" = ac."userId",
    "approvedAt" = COALESCE(ou."approvedAt", NOW()),
    "updatedAt" = NOW()
FROM admin_candidates ac
WHERE ou."id" = ac."membershipId"
    AND ou."role" <> 'ORG_ADMIN';

-- 5) Seed student org memberships when they can be inferred by domain.
--    This only inserts into existing organizations (no student-created orgs).
WITH student_orgs AS (
    SELECT DISTINCT
        st."userId" AS "userId",
        o."id" AS "organizationId"
    FROM "classroomStudentToken" st
    INNER JOIN "user" u ON u."id" = st."userId"
    INNER JOIN "organization" o ON o."domain" = LOWER(SPLIT_PART(u."email", '@', 2))
    WHERE u."email" IS NOT NULL
        AND POSITION('@' IN u."email") > 1
),
missing_student_memberships AS (
    SELECT
        so."organizationId",
        so."userId"
    FROM student_orgs so
    LEFT JOIN "organizationUser" ou
        ON ou."organizationId" = so."organizationId"
        AND ou."userId" = so."userId"
    WHERE ou."id" IS NULL
)
INSERT INTO "organizationUser" (
    "id",
    "organizationId",
    "userId",
    "role",
    "status",
    "approvedByUserId",
    "approvedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('org_user_', MD5(msm."organizationId" || ':' || msm."userId")) AS "id",
    msm."organizationId",
    msm."userId",
    'STUDENT',
    'APPROVED',
    NULL,
    NOW(),
    NOW(),
    NOW()
FROM missing_student_memberships msm
ON CONFLICT ("organizationId", "userId") DO NOTHING;

-- 6) Backfill legacy assignment organizationId values for teachers
--    that belong to exactly one approved teaching organization.
WITH teacher_single_org AS (
    SELECT
        ou."userId" AS "userId",
        MIN(ou."organizationId") AS "organizationId"
    FROM "organizationUser" ou
    WHERE ou."status" = 'APPROVED'
        AND ou."role" IN ('ORG_ADMIN', 'TEACHER')
    GROUP BY ou."userId"
    HAVING COUNT(DISTINCT ou."organizationId") = 1
)
UPDATE "classroomAssignment" ca
SET
    "organizationId" = tso."organizationId",
    "updatedAt" = NOW()
FROM teacher_single_org tso
WHERE ca."organizationId" IS NULL
    AND ca."teacherUserId" = tso."userId";

-- 7) Seed course-teacher mappings from existing assignments.
INSERT INTO "courseTeacher" (
    "organizationId",
    "courseId",
    "teacherUserId",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT
    ca."organizationId",
    ca."courseId",
    ca."teacherUserId",
    NOW(),
    NOW()
FROM "classroomAssignment" ca
INNER JOIN "organizationUser" ou
    ON ou."organizationId" = ca."organizationId"
    AND ou."userId" = ca."teacherUserId"
WHERE ca."organizationId" IS NOT NULL
    AND ou."status" = 'APPROVED'
    AND ou."role" IN ('ORG_ADMIN', 'TEACHER')
ON CONFLICT ("organizationId", "courseId", "teacherUserId")
DO UPDATE
SET "updatedAt" = EXCLUDED."updatedAt";

-- 8) Post-check summary.
SELECT COUNT(*) AS organization_count FROM "organization";
SELECT COUNT(*) AS organization_user_count FROM "organizationUser";
SELECT COUNT(*) AS assignment_with_org_count
FROM "classroomAssignment"
WHERE "organizationId" IS NOT NULL;
SELECT COUNT(*) AS course_teacher_count FROM "courseTeacher";
