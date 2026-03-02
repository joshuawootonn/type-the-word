import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        query: {
            organization: {
                findFirst: vi.fn(),
            },
            organizationUser: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(),
        select: vi.fn(),
        transaction: vi.fn(),
    },
}))

vi.mock("~/server/db", () => ({
    db: mockDb,
}))

let approveTeacherMembership: typeof import("./organization.repository").approveTeacherMembership
let countApprovedTeacherMemberships: typeof import("./organization.repository").countApprovedTeacherMemberships
let ensureTeacherMembershipOnConnect: typeof import("./organization.repository").ensureTeacherMembershipOnConnect
let hasAnotherApprovedOrganizationAdmin: typeof import("./organization.repository").hasAnotherApprovedOrganizationAdmin
let getApprovedOrganizationForUser: typeof import("./organization.repository").getApprovedOrganizationForUser
let getApprovedOrganizationMembership: typeof import("./organization.repository").getApprovedOrganizationMembership
let getDomainFromEmail: typeof import("./organization.repository").getDomainFromEmail
let getOrganizationByDomain: typeof import("./organization.repository").getOrganizationByDomain
let getOrganizationById: typeof import("./organization.repository").getOrganizationById
let getOrganizationMembership: typeof import("./organization.repository").getOrganizationMembership
let getOrCreateOrganizationByDomain: typeof import("./organization.repository").getOrCreateOrganizationByDomain
let isUserApprovedTeacherForCourse: typeof import("./organization.repository").isUserApprovedTeacherForCourse
let isUserOrganizationAdmin: typeof import("./organization.repository").isUserOrganizationAdmin
let listApprovedTeacherUserIdsForCourse: typeof import("./organization.repository").listApprovedTeacherUserIdsForCourse
let listOrganizationDirectoryUsers: typeof import("./organization.repository").listOrganizationDirectoryUsers
let listPendingTeacherMemberships: typeof import("./organization.repository").listPendingTeacherMemberships
let promoteTeacherToAdmin: typeof import("./organization.repository").promoteTeacherToAdmin
let syncTeacherCourseMappings: typeof import("./organization.repository").syncTeacherCourseMappings
let upsertOrganizationMembership: typeof import("./organization.repository").upsertOrganizationMembership

describe("OrganizationRepository - Unit Tests", () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()

        const repo = await import("./organization.repository")
        approveTeacherMembership = repo.approveTeacherMembership
        countApprovedTeacherMemberships = repo.countApprovedTeacherMemberships
        ensureTeacherMembershipOnConnect = repo.ensureTeacherMembershipOnConnect
        hasAnotherApprovedOrganizationAdmin =
            repo.hasAnotherApprovedOrganizationAdmin
        getApprovedOrganizationForUser = repo.getApprovedOrganizationForUser
        getApprovedOrganizationMembership =
            repo.getApprovedOrganizationMembership
        getDomainFromEmail = repo.getDomainFromEmail
        getOrganizationByDomain = repo.getOrganizationByDomain
        getOrganizationById = repo.getOrganizationById
        getOrganizationMembership = repo.getOrganizationMembership
        getOrCreateOrganizationByDomain = repo.getOrCreateOrganizationByDomain
        isUserApprovedTeacherForCourse = repo.isUserApprovedTeacherForCourse
        isUserOrganizationAdmin = repo.isUserOrganizationAdmin
        listApprovedTeacherUserIdsForCourse =
            repo.listApprovedTeacherUserIdsForCourse
        listOrganizationDirectoryUsers = repo.listOrganizationDirectoryUsers
        listPendingTeacherMemberships = repo.listPendingTeacherMemberships
        promoteTeacherToAdmin = repo.promoteTeacherToAdmin
        syncTeacherCourseMappings = repo.syncTeacherCourseMappings
        upsertOrganizationMembership = repo.upsertOrganizationMembership
    })

    afterAll(() => {
        vi.doUnmock("~/server/db")
        vi.resetModules()
    })

    it("extracts and normalizes domains from emails", () => {
        expect(getDomainFromEmail("Teacher@School.Example.edu")).toBe(
            "school.example.edu",
        )
        expect(getDomainFromEmail("invalid-email")).toBeNull()
    })

    it("queries organizations by domain", async () => {
        mockDb.query.organization.findFirst.mockResolvedValue({ id: "org-1" })

        const result = await getOrganizationByDomain("SCHOOL.edu")

        expect(mockDb.query.organization.findFirst).toHaveBeenCalledOnce()
        expect(result?.id).toBe("org-1")
    })

    it("queries organizations by id", async () => {
        mockDb.query.organization.findFirst.mockResolvedValue({ id: "org-1" })

        const result = await getOrganizationById("org-1")

        expect(mockDb.query.organization.findFirst).toHaveBeenCalledOnce()
        expect(result?.id).toBe("org-1")
    })

    it("creates or updates organizations by domain", async () => {
        const returning = vi.fn().mockResolvedValue([{ id: "org-1" }])
        const onConflictDoUpdate = vi.fn(() => ({ returning }))
        const values = vi.fn(() => ({ onConflictDoUpdate }))
        mockDb.insert.mockReturnValue({ values })

        const result = await getOrCreateOrganizationByDomain({
            domain: "School.edu",
        })

        expect(mockDb.insert).toHaveBeenCalledOnce()
        expect(values).toHaveBeenCalledOnce()
        expect(onConflictDoUpdate).toHaveBeenCalledOnce()
        expect(result.id).toBe("org-1")
    })

    it("gets organization membership", async () => {
        mockDb.query.organizationUser.findFirst.mockResolvedValue({
            id: "membership-1",
        })

        const result = await getOrganizationMembership({
            organizationId: "org-1",
            userId: "user-1",
        })

        expect(result?.id).toBe("membership-1")
    })

    it("upserts organization membership", async () => {
        const returning = vi.fn().mockResolvedValue([{ id: "membership-1" }])
        const onConflictDoUpdate = vi.fn(() => ({ returning }))
        const values = vi.fn(() => ({ onConflictDoUpdate }))
        mockDb.insert.mockReturnValue({ values })

        const result = await upsertOrganizationMembership({
            organizationId: "org-1",
            userId: "user-1",
            role: "TEACHER",
            status: "PENDING",
        })

        expect(result.id).toBe("membership-1")
    })

    it("counts approved teacher memberships", async () => {
        const where = vi.fn().mockResolvedValue([{ count: 3 }])
        const from = vi.fn(() => ({ where }))
        mockDb.select.mockReturnValue({ from })

        const result = await countApprovedTeacherMemberships("org-1")

        expect(result).toBe(3)
    })

    it("returns approved admin membership for first connected teacher", async () => {
        const orgReturning = vi.fn().mockResolvedValue([{ id: "org-1" }])
        const orgOnConflict = vi.fn(() => ({ returning: orgReturning }))
        const orgValues = vi.fn(() => ({ onConflictDoUpdate: orgOnConflict }))

        const membershipReturning = vi.fn().mockResolvedValue([
            {
                id: "membership-1",
                organizationId: "org-1",
                userId: "user-1",
                role: "ORG_ADMIN",
                status: "APPROVED",
                approvedByUserId: "user-1",
                approvedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])
        const membershipOnConflict = vi.fn(() => ({
            returning: membershipReturning,
        }))
        const membershipValues = vi.fn(() => ({
            onConflictDoUpdate: membershipOnConflict,
        }))

        mockDb.insert
            .mockReturnValueOnce({ values: orgValues })
            .mockReturnValueOnce({ values: membershipValues })
        mockDb.query.organizationUser.findFirst.mockResolvedValue(undefined)
        const where = vi.fn().mockResolvedValue([{ count: 0 }])
        const from = vi.fn(() => ({ where }))
        mockDb.select.mockReturnValue({ from })

        const result = await ensureTeacherMembershipOnConnect({
            userId: "user-1",
            domain: "school.edu",
        })

        expect(result.isFirstTeacher).toBe(true)
        expect(result.needsApproval).toBe(false)
        expect(result.membership.role).toBe("ORG_ADMIN")
    })

    it("returns pending for non-first teacher", async () => {
        const orgReturning = vi.fn().mockResolvedValue([{ id: "org-1" }])
        const orgOnConflict = vi.fn(() => ({ returning: orgReturning }))
        const orgValues = vi.fn(() => ({ onConflictDoUpdate: orgOnConflict }))

        const membershipReturning = vi.fn().mockResolvedValue([
            {
                id: "membership-2",
                organizationId: "org-1",
                userId: "user-2",
                role: "TEACHER",
                status: "PENDING",
                approvedByUserId: null,
                approvedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])
        const membershipOnConflict = vi.fn(() => ({
            returning: membershipReturning,
        }))
        const membershipValues = vi.fn(() => ({
            onConflictDoUpdate: membershipOnConflict,
        }))

        mockDb.insert
            .mockReturnValueOnce({ values: orgValues })
            .mockReturnValueOnce({ values: membershipValues })
        mockDb.query.organizationUser.findFirst.mockResolvedValue(undefined)
        const where = vi.fn().mockResolvedValue([{ count: 1 }])
        const from = vi.fn(() => ({ where }))
        mockDb.select.mockReturnValue({ from })

        const result = await ensureTeacherMembershipOnConnect({
            userId: "user-2",
            domain: "school.edu",
        })

        expect(result.needsApproval).toBe(true)
        expect(result.membership.status).toBe("PENDING")
    })

    it("checks if user is organization admin", async () => {
        mockDb.query.organizationUser.findFirst.mockResolvedValue({
            role: "ORG_ADMIN",
            status: "APPROVED",
        })

        const result = await isUserOrganizationAdmin({
            organizationId: "org-1",
            userId: "user-1",
        })

        expect(result).toBe(true)
    })

    it("approves teacher membership when approver is admin", async () => {
        mockDb.query.organizationUser.findFirst
            .mockResolvedValueOnce({
                role: "ORG_ADMIN",
                status: "APPROVED",
            })
            .mockResolvedValueOnce({
                role: "TEACHER",
                status: "PENDING",
            })

        const returning = vi.fn().mockResolvedValue([
            {
                role: "TEACHER",
                status: "APPROVED",
            },
        ])
        const onConflictDoUpdate = vi.fn(() => ({ returning }))
        const values = vi.fn(() => ({ onConflictDoUpdate }))
        mockDb.insert.mockReturnValue({ values })

        const result = await approveTeacherMembership({
            organizationId: "org-1",
            teacherUserId: "teacher-1",
            approvedByUserId: "admin-1",
        })

        expect(result?.status).toBe("APPROVED")
    })

    it("throws when non-admin approves teacher", async () => {
        mockDb.query.organizationUser.findFirst.mockResolvedValue({
            role: "TEACHER",
            status: "APPROVED",
        })

        await expect(
            approveTeacherMembership({
                organizationId: "org-1",
                teacherUserId: "teacher-1",
                approvedByUserId: "teacher-2",
            }),
        ).rejects.toThrow("Only organization admins can approve teachers")
    })

    it("promotes approved teacher to org admin", async () => {
        mockDb.query.organizationUser.findFirst
            .mockResolvedValueOnce({
                role: "ORG_ADMIN",
                status: "APPROVED",
            })
            .mockResolvedValueOnce({
                role: "TEACHER",
                status: "APPROVED",
                approvedAt: new Date("2025-01-01T00:00:00.000Z"),
            })

        const returning = vi.fn().mockResolvedValue([
            {
                role: "ORG_ADMIN",
                status: "APPROVED",
            },
        ])
        const onConflictDoUpdate = vi.fn(() => ({ returning }))
        const values = vi.fn(() => ({ onConflictDoUpdate }))
        mockDb.insert.mockReturnValue({ values })

        const result = await promoteTeacherToAdmin({
            organizationId: "org-1",
            teacherUserId: "teacher-1",
            promotedByUserId: "admin-1",
        })

        expect(result.role).toBe("ORG_ADMIN")
    })

    it("throws when promoting a non-teacher role", async () => {
        mockDb.query.organizationUser.findFirst
            .mockResolvedValueOnce({
                role: "ORG_ADMIN",
                status: "APPROVED",
            })
            .mockResolvedValueOnce({
                role: "STUDENT",
                status: "APPROVED",
            })

        await expect(
            promoteTeacherToAdmin({
                organizationId: "org-1",
                teacherUserId: "student-1",
                promotedByUserId: "admin-1",
            }),
        ).rejects.toThrow("Only teachers can be promoted to admin")
    })

    it("detects when another approved org admin exists", async () => {
        const limit = vi.fn().mockResolvedValue([{ userId: "admin-2" }])
        const where = vi.fn(() => ({ limit }))
        const from = vi.fn(() => ({ where }))
        mockDb.select.mockReturnValue({ from })

        const result = await hasAnotherApprovedOrganizationAdmin({
            organizationId: "org-1",
            excludingUserId: "admin-1",
        })

        expect(result).toBe(true)
    })

    it("returns approved membership helper", async () => {
        mockDb.query.organizationUser.findFirst.mockResolvedValue({
            role: "TEACHER",
            status: "APPROVED",
        })

        const result = await getApprovedOrganizationMembership({
            organizationId: "org-1",
            userId: "user-1",
        })

        expect(result?.status).toBe("APPROVED")
    })

    it("returns approved organization for user", async () => {
        const limit = vi.fn().mockResolvedValue([{ org: { id: "org-1" } }])
        const where = vi.fn(() => ({ limit }))
        const innerJoin = vi.fn(() => ({ where }))
        const from = vi.fn(() => ({ innerJoin }))
        mockDb.select.mockReturnValue({ from })

        const result = await getApprovedOrganizationForUser("user-1")

        expect(result?.id).toBe("org-1")
    })

    it("syncs teacher course mappings", async () => {
        const deleteWhere = vi.fn().mockResolvedValue(undefined)
        const txDelete = vi.fn(() => ({ where: deleteWhere }))
        const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
        const txInsert = vi.fn(() => ({
            values: vi.fn(() => ({ onConflictDoUpdate })),
        }))

        mockDb.transaction.mockImplementation(async callback =>
            callback({
                delete: txDelete,
                insert: txInsert,
            }),
        )

        await syncTeacherCourseMappings({
            organizationId: "org-1",
            teacherUserId: "teacher-1",
            courseIds: ["course-1"],
        })

        expect(mockDb.transaction).toHaveBeenCalledOnce()
    })

    it("clears course mappings when no courses are provided", async () => {
        const deleteWhere = vi.fn().mockResolvedValue(undefined)
        const txDelete = vi.fn(() => ({ where: deleteWhere }))
        const txInsert = vi.fn()

        mockDb.transaction.mockImplementation(async callback =>
            callback({
                delete: txDelete,
                insert: txInsert,
            }),
        )

        await syncTeacherCourseMappings({
            organizationId: "org-1",
            teacherUserId: "teacher-1",
            courseIds: [],
        })

        expect(txDelete).toHaveBeenCalledOnce()
        expect(txInsert).not.toHaveBeenCalled()
    })

    it("lists approved teachers for a course", async () => {
        const where = vi
            .fn()
            .mockResolvedValue([{ teacherUserId: "teacher-1" }])
        const innerJoin = vi.fn(() => ({ where }))
        const from = vi.fn(() => ({ innerJoin }))
        mockDb.select.mockReturnValue({ from })

        const result = await listApprovedTeacherUserIdsForCourse({
            organizationId: "org-1",
            courseId: "course-1",
        })

        expect(result).toEqual(["teacher-1"])
    })

    it("checks approved teacher access for course", async () => {
        const limit = vi.fn().mockResolvedValue([{ userId: "teacher-1" }])
        const where = vi.fn(() => ({ limit }))
        const innerJoin = vi.fn(() => ({ where }))
        const from = vi.fn(() => ({ innerJoin }))
        mockDb.select.mockReturnValue({ from })

        const result = await isUserApprovedTeacherForCourse({
            organizationId: "org-1",
            courseId: "course-1",
            userId: "teacher-1",
        })

        expect(result).toBe(true)
    })

    it("lists pending teachers and directory users", async () => {
        const pendingWhere = vi.fn().mockResolvedValue([
            {
                membership: { id: "membership-1" },
                user: {
                    id: "user-1",
                    email: "user-1@example.com",
                    name: "User 1",
                },
            },
        ])
        const pendingInnerJoin = vi.fn(() => ({ where: pendingWhere }))
        const pendingFrom = vi.fn(() => ({ innerJoin: pendingInnerJoin }))
        mockDb.select.mockReturnValueOnce({ from: pendingFrom })

        const pending = await listPendingTeacherMemberships("org-1")
        expect(pending[0]?.user.email).toBe("user-1@example.com")

        const directoryWhere = vi.fn().mockResolvedValue([
            {
                userId: "user-1",
                email: "user-1@example.com",
                name: "User 1",
                role: "TEACHER",
                status: "APPROVED",
                approvedAt: new Date("2025-01-01T00:00:00.000Z"),
                teacherTokenUserId: "user-1",
                studentTokenUserId: null,
            },
        ])
        const directoryLeftJoin2 = vi.fn(() => ({ where: directoryWhere }))
        const directoryLeftJoin1 = vi.fn(() => ({
            leftJoin: directoryLeftJoin2,
        }))
        const directoryInnerJoin = vi.fn(() => ({
            leftJoin: directoryLeftJoin1,
        }))
        const directoryFrom = vi.fn(() => ({ innerJoin: directoryInnerJoin }))
        mockDb.select.mockReturnValueOnce({ from: directoryFrom })

        const directory = await listOrganizationDirectoryUsers("org-1")
        expect(directory[0]?.hasTeacherConnection).toBe(true)
        expect(directory[0]?.approvedAt).toBe("2025-01-01T00:00:00.000Z")
    })
})
