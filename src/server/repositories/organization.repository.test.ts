import { inArray } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/db"
import {
    courseTeacher,
    classroomStudentToken,
    classroomTeacherToken,
    organization,
    organizationSettings,
    organizationUser,
    users,
} from "~/server/db/schema"

import {
    approveTeacherMembership,
    ensureTeacherMembershipOnConnect,
    hasAnotherApprovedOrganizationAdmin,
    getApprovedOrganizationForUser,
    getApprovedOrganizationMembership,
    getDomainFromEmail,
    getOrganizationByDomain,
    getOrganizationById,
    getOrganizationSettingsByOrganizationId,
    getOrganizationSettingsByOrganizationIdOrThrow,
    getOrganizationMembership,
    getOrCreateOrganizationByDomain,
    isUserApprovedOrganizationTeacher,
    updateOrganizationSettings,
    isUserApprovedTeacherForCourse,
    listApprovedTeacherUserIdsForCourse,
    listOrganizationDirectoryUsers,
    listPendingTeacherMemberships,
    promoteTeacherToAdmin,
    syncTeacherCourseMappings,
    upsertOrganizationMembership,
} from "./organization.repository"

describe("OrganizationRepository - Integration Tests", () => {
    let userIds: string[]
    let organizationIds: string[]

    beforeEach(() => {
        userIds = []
        organizationIds = []
    })

    afterEach(async () => {
        if (userIds.length > 0) {
            await db
                .delete(classroomTeacherToken)
                .where(inArray(classroomTeacherToken.userId, userIds))
            await db
                .delete(classroomStudentToken)
                .where(inArray(classroomStudentToken.userId, userIds))
        }

        if (organizationIds.length > 0) {
            await db
                .delete(organizationSettings)
                .where(
                    inArray(
                        organizationSettings.organizationId,
                        organizationIds,
                    ),
                )
            await db
                .delete(courseTeacher)
                .where(inArray(courseTeacher.organizationId, organizationIds))
            await db
                .delete(organizationUser)
                .where(
                    inArray(organizationUser.organizationId, organizationIds),
                )
            await db
                .delete(organization)
                .where(inArray(organization.id, organizationIds))
        }

        if (userIds.length > 0) {
            await db.delete(users).where(inArray(users.id, userIds))
        }
    })

    async function createUser(email: string, name: string): Promise<string> {
        const id = crypto.randomUUID()
        userIds.push(id)
        await db.insert(users).values({
            id,
            email,
            name,
        })
        return id
    }

    function uniqueDomain(prefix: string): string {
        return `${prefix}-${crypto.randomUUID().slice(0, 8)}.edu`
    }

    it("creates and retrieves organizations by domain", async () => {
        const domain = uniqueDomain("school-example")
        const org = await getOrCreateOrganizationByDomain({
            domain: domain.toUpperCase(),
            name: "School Example",
        })
        organizationIds.push(org.id)

        const byDomain = await getOrganizationByDomain(domain)
        const byId = await getOrganizationById(org.id)

        expect(byDomain?.id).toBe(org.id)
        expect(byId?.domain).toBe(domain)
        expect(getDomainFromEmail(`Teacher@${domain.toUpperCase()}`)).toBe(
            domain,
        )

        const settings = await getOrganizationSettingsByOrganizationId(org.id)
        expect(settings?.accuracyThreshold).toBe(90)
        expect(settings?.regularAccuracyThreshold).toBe(30)
    })

    it("updates organization settings and strict getter returns both thresholds", async () => {
        const domain = uniqueDomain("settings")
        const org = await getOrCreateOrganizationByDomain({
            domain,
            name: "Settings School",
        })
        organizationIds.push(org.id)

        await updateOrganizationSettings({
            organizationId: org.id,
            accuracyThreshold: 91,
            regularAccuracyThreshold: 42,
        })

        const strictSettings =
            await getOrganizationSettingsByOrganizationIdOrThrow({
                organizationId: org.id,
            })

        expect(strictSettings.accuracyThreshold).toBe(91)
        expect(strictSettings.regularAccuracyThreshold).toBe(42)
    })

    it("upserts memberships and approved membership helpers", async () => {
        const domain = uniqueDomain("example")
        const userId = await createUser(`teacher-1@${domain}`, "Teacher 1")
        const org = await getOrCreateOrganizationByDomain({
            domain,
        })
        organizationIds.push(org.id)

        const pending = await upsertOrganizationMembership({
            organizationId: org.id,
            userId,
            role: "TEACHER",
            status: "PENDING",
        })
        const approved = await upsertOrganizationMembership({
            organizationId: org.id,
            userId,
            role: "TEACHER",
            status: "APPROVED",
            approvedByUserId: userId,
            approvedAt: new Date(),
        })

        const membership = await getOrganizationMembership({
            organizationId: org.id,
            userId,
        })
        const approvedMembership = await getApprovedOrganizationMembership({
            organizationId: org.id,
            userId,
        })
        const approvedOrg = await getApprovedOrganizationForUser(userId)

        expect(pending.status).toBe("PENDING")
        expect(approved.status).toBe("APPROVED")
        expect(membership?.status).toBe("APPROVED")
        expect(approvedMembership?.userId).toBe(userId)
        expect(approvedOrg?.id).toBe(org.id)
    })

    it("checks approved organization teacher membership", async () => {
        const domain = uniqueDomain("teacher-check")
        const userId = await createUser(`teacher@${domain}`, "Teacher")
        const org = await getOrCreateOrganizationByDomain({ domain })
        organizationIds.push(org.id)

        await upsertOrganizationMembership({
            organizationId: org.id,
            userId,
            role: "TEACHER",
            status: "APPROVED",
            approvedByUserId: userId,
            approvedAt: new Date(),
        })

        const result = await isUserApprovedOrganizationTeacher({
            organizationId: org.id,
            userId,
        })

        expect(result).toBe(true)
    })

    it("bootstraps first teacher as admin and second as pending", async () => {
        const domain = uniqueDomain("school")
        const firstTeacherUserId = await createUser(
            `first@${domain}`,
            "First Teacher",
        )
        const secondTeacherUserId = await createUser(
            `second@${domain}`,
            "Second Teacher",
        )

        const first = await ensureTeacherMembershipOnConnect({
            userId: firstTeacherUserId,
            domain,
        })
        organizationIds.push(first.organization.id)

        const second = await ensureTeacherMembershipOnConnect({
            userId: secondTeacherUserId,
            domain,
        })

        expect(first.isFirstTeacher).toBe(true)
        expect(first.needsApproval).toBe(false)
        expect(first.membership.role).toBe("ORG_ADMIN")
        expect(first.membership.status).toBe("APPROVED")

        expect(second.isFirstTeacher).toBe(false)
        expect(second.needsApproval).toBe(true)
        expect(second.membership.role).toBe("TEACHER")
        expect(second.membership.status).toBe("PENDING")
    })

    it("approves pending teacher memberships by org admin", async () => {
        const domain = uniqueDomain("org")
        const adminUserId = await createUser(`admin@${domain}`, "Admin")
        const teacherUserId = await createUser(`teacher@${domain}`, "Teacher")

        const adminMembership = await ensureTeacherMembershipOnConnect({
            userId: adminUserId,
            domain,
        })
        organizationIds.push(adminMembership.organization.id)

        await ensureTeacherMembershipOnConnect({
            userId: teacherUserId,
            domain,
        })

        const approved = await approveTeacherMembership({
            organizationId: adminMembership.organization.id,
            teacherUserId,
            approvedByUserId: adminUserId,
        })

        expect(approved.status).toBe("APPROVED")
        expect(approved.approvedByUserId).toBe(adminUserId)

        const pending = await listPendingTeacherMemberships(
            adminMembership.organization.id,
        )
        expect(pending).toHaveLength(0)
    })

    it("syncs course-teacher mappings and checks course access", async () => {
        const domain = uniqueDomain("courses")
        const adminUserId = await createUser(`admin@${domain}`, "Admin")
        const teacherUserId = await createUser(`teacher@${domain}`, "Teacher")

        const adminMembership = await ensureTeacherMembershipOnConnect({
            userId: adminUserId,
            domain,
        })
        organizationIds.push(adminMembership.organization.id)
        await ensureTeacherMembershipOnConnect({
            userId: teacherUserId,
            domain,
        })
        await approveTeacherMembership({
            organizationId: adminMembership.organization.id,
            teacherUserId,
            approvedByUserId: adminUserId,
        })

        await syncTeacherCourseMappings({
            organizationId: adminMembership.organization.id,
            teacherUserId,
            courseIds: ["course-1", "course-2"],
        })

        const teachersCourse1 = await listApprovedTeacherUserIdsForCourse({
            organizationId: adminMembership.organization.id,
            courseId: "course-1",
        })
        const hasCourse1Access = await isUserApprovedTeacherForCourse({
            organizationId: adminMembership.organization.id,
            courseId: "course-1",
            userId: teacherUserId,
        })

        expect(teachersCourse1).toContain(teacherUserId)
        expect(hasCourse1Access).toBe(true)

        await syncTeacherCourseMappings({
            organizationId: adminMembership.organization.id,
            teacherUserId,
            courseIds: ["course-2"],
        })

        const hasCourse1AccessAfterSync = await isUserApprovedTeacherForCourse({
            organizationId: adminMembership.organization.id,
            courseId: "course-1",
            userId: teacherUserId,
        })
        expect(hasCourse1AccessAfterSync).toBe(false)
    })

    it("returns organization directory users with token connection flags", async () => {
        const domain = uniqueDomain("directory")
        const adminUserId = await createUser(`admin@${domain}`, "Admin")
        const studentUserId = await createUser(`student@${domain}`, "Student")

        const adminMembership = await ensureTeacherMembershipOnConnect({
            userId: adminUserId,
            domain,
        })
        organizationIds.push(adminMembership.organization.id)

        await upsertOrganizationMembership({
            organizationId: adminMembership.organization.id,
            userId: studentUserId,
            role: "STUDENT",
            status: "APPROVED",
            approvedByUserId: adminUserId,
            approvedAt: new Date(),
        })

        await db.insert(classroomTeacherToken).values({
            userId: adminUserId,
            accessToken: "teacher-token",
            refreshToken: "teacher-refresh",
            expiresAt: new Date(Date.now() + 60 * 1000),
            scope: "scope",
        })
        await db.insert(classroomStudentToken).values({
            userId: studentUserId,
            googleUserId: `google-${studentUserId}`,
            accessToken: "student-token",
            refreshToken: "student-refresh",
            expiresAt: new Date(Date.now() + 60 * 1000),
            scope: "scope",
        })

        const directory = await listOrganizationDirectoryUsers(
            adminMembership.organization.id,
        )
        const adminEntry = directory.find(user => user.userId === adminUserId)
        const studentEntry = directory.find(
            user => user.userId === studentUserId,
        )

        expect(adminEntry?.hasTeacherConnection).toBe(true)
        expect(adminEntry?.role).toBe("ORG_ADMIN")
        expect(studentEntry?.hasStudentConnection).toBe(true)
        expect(studentEntry?.role).toBe("STUDENT")
    })

    it("throws when non-admin tries to approve teacher", async () => {
        const domain = uniqueDomain("authz")
        const adminUserId = await createUser(`admin@${domain}`, "Admin")
        const teacherUserId = await createUser(`teacher@${domain}`, "Teacher")
        const nonAdminUserId = await createUser(`member@${domain}`, "Member")

        const adminMembership = await ensureTeacherMembershipOnConnect({
            userId: adminUserId,
            domain,
        })
        organizationIds.push(adminMembership.organization.id)
        await ensureTeacherMembershipOnConnect({
            userId: teacherUserId,
            domain,
        })
        await upsertOrganizationMembership({
            organizationId: adminMembership.organization.id,
            userId: nonAdminUserId,
            role: "STUDENT",
            status: "APPROVED",
            approvedByUserId: adminUserId,
            approvedAt: new Date(),
        })

        await expect(
            approveTeacherMembership({
                organizationId: adminMembership.organization.id,
                teacherUserId,
                approvedByUserId: nonAdminUserId,
            }),
        ).rejects.toThrow("Only organization admins can approve teachers")
    })

    it("lists pending teachers with user info", async () => {
        const domain = uniqueDomain("pending")
        const adminUserId = await createUser(`admin@${domain}`, "Admin")
        const teacherUserId = await createUser(`teacher@${domain}`, "Teacher")

        const adminMembership = await ensureTeacherMembershipOnConnect({
            userId: adminUserId,
            domain,
        })
        organizationIds.push(adminMembership.organization.id)
        await ensureTeacherMembershipOnConnect({
            userId: teacherUserId,
            domain,
        })

        const pending = await listPendingTeacherMemberships(
            adminMembership.organization.id,
        )
        expect(pending).toHaveLength(1)
        expect(pending[0]?.user.id).toBe(teacherUserId)
        expect(pending[0]?.status).toBe("PENDING")
    })

    it("promotes an approved teacher to admin", async () => {
        const domain = uniqueDomain("promote")
        const adminUserId = await createUser(`admin@${domain}`, "Admin")
        const teacherUserId = await createUser(`teacher@${domain}`, "Teacher")

        const adminMembership = await ensureTeacherMembershipOnConnect({
            userId: adminUserId,
            domain,
        })
        organizationIds.push(adminMembership.organization.id)
        await ensureTeacherMembershipOnConnect({
            userId: teacherUserId,
            domain,
        })
        await approveTeacherMembership({
            organizationId: adminMembership.organization.id,
            teacherUserId,
            approvedByUserId: adminUserId,
        })

        const promoted = await promoteTeacherToAdmin({
            organizationId: adminMembership.organization.id,
            teacherUserId,
            promotedByUserId: adminUserId,
        })

        expect(promoted.role).toBe("ORG_ADMIN")
        expect(promoted.status).toBe("APPROVED")
    })

    it("reports whether another admin exists", async () => {
        const domain = uniqueDomain("admins")
        const admin1UserId = await createUser(`admin1@${domain}`, "Admin 1")
        const admin2UserId = await createUser(`admin2@${domain}`, "Admin 2")

        const first = await ensureTeacherMembershipOnConnect({
            userId: admin1UserId,
            domain,
        })
        organizationIds.push(first.organization.id)
        await ensureTeacherMembershipOnConnect({
            userId: admin2UserId,
            domain,
        })
        await approveTeacherMembership({
            organizationId: first.organization.id,
            teacherUserId: admin2UserId,
            approvedByUserId: admin1UserId,
        })
        await promoteTeacherToAdmin({
            organizationId: first.organization.id,
            teacherUserId: admin2UserId,
            promotedByUserId: admin1UserId,
        })

        const hasAnotherForAdmin1 = await hasAnotherApprovedOrganizationAdmin({
            organizationId: first.organization.id,
            excludingUserId: admin1UserId,
        })
        const hasAnotherForAdmin2 = await hasAnotherApprovedOrganizationAdmin({
            organizationId: first.organization.id,
            excludingUserId: admin2UserId,
        })

        expect(hasAnotherForAdmin1).toBe(true)
        expect(hasAnotherForAdmin2).toBe(true)
    })
})
