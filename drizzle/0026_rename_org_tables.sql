DO $$
BEGIN
    IF to_regclass('"classroomCourseTeacher"') IS NOT NULL
        AND to_regclass('"courseTeacher"') IS NULL THEN
        ALTER TABLE "classroomCourseTeacher" RENAME TO "courseTeacher";
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF to_regclass('"organizationMembership"') IS NOT NULL
        AND to_regclass('"organizationUser"') IS NULL THEN
        ALTER TABLE "organizationMembership" RENAME TO "organizationUser";
    END IF;
END $$;
--> statement-breakpoint
ALTER INDEX IF EXISTS "classroomCourseTeacher_organizationId_idx" RENAME TO "courseTeacher_organizationId_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "classroomCourseTeacher_courseId_idx" RENAME TO "courseTeacher_courseId_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "classroomCourseTeacher_teacherUserId_idx" RENAME TO "courseTeacher_teacherUserId_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "organizationMembership_organizationId_idx" RENAME TO "organizationUser_organizationId_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "organizationMembership_userId_idx" RENAME TO "organizationUser_userId_idx";
--> statement-breakpoint
ALTER INDEX IF EXISTS "organizationMembership_status_idx" RENAME TO "organizationUser_status_idx";
--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'classroomCourseTeacher_organizationId_courseId_teacherUserId_pk'
    ) THEN
        ALTER TABLE "courseTeacher"
            RENAME CONSTRAINT "classroomCourseTeacher_organizationId_courseId_teacherUserId_pk"
            TO "courseTeacher_organizationId_courseId_teacherUserId_pk";
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organizationMembership_organizationId_userId_unique'
    ) THEN
        ALTER TABLE "organizationUser"
            RENAME CONSTRAINT "organizationMembership_organizationId_userId_unique"
            TO "organizationUser_organizationId_userId_unique";
    END IF;
END $$;