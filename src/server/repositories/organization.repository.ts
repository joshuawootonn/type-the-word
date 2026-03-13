import { and, eq, inArray, ne, notInArray, sql } from "drizzle-orm"

import { db } from "~/server/db"
import {
    courseTeacher,
    classroomStudentToken,
    classroomTeacherToken,
    organization,
    organizationSettings,
    organizationUser,
    organizationRole,
    organizationUserState,
    users,
} from "~/server/db/schema"

type Organization = typeof organization.$inferSelect
type OrganizationSettings = typeof organizationSettings.$inferSelect
type OrganizationMembership = typeof organizationUser.$inferSelect
type OrganizationRole = (typeof organizationRole.enumValues)[number]
type OrganizationUserState = (typeof organizationUserState.enumValues)[number]
type User = typeof users.$inferSelect

const teacherRoles: OrganizationRole[] = ["ORG_ADMIN", "TEACHER"]

function normalizeDomain(domain: string): string {
    return domain.trim().toLowerCase()
}

export function getDomainFromEmail(email: string): string | null {
    const trimmedEmail = email.trim().toLowerCase()
    const parts = trimmedEmail.split("@")
    const domain = parts[1]
    if (parts.length !== 2 || !domain || domain.length === 0) {
        return null
    }
    return domain
}

export async function getOrganizationByDomain(
    domain: string,
): Promise<Organization | undefined> {
    return await db.query.organization.findFirst({
        where: eq(organization.domain, normalizeDomain(domain)),
    })
}

export async function getOrganizationById(
    organizationId: string,
): Promise<Organization | undefined> {
    return await db.query.organization.findFirst({
        where: eq(organization.id, organizationId),
    })
}

export async function getOrganizationSettingsByOrganizationId(
    organizationId: string,
): Promise<OrganizationSettings | undefined> {
    return await db.query.organizationSettings.findFirst({
        where: eq(organizationSettings.organizationId, organizationId),
    })
}

export async function getOrganizationSettingsByOrganizationIdOrThrow(data: {
    organizationId: string
}): Promise<OrganizationSettings> {
    const settings = await getOrganizationSettingsByOrganizationId(
        data.organizationId,
    )
    if (!settings) {
        throw new Error(
            `Organization settings are missing for organization ${data.organizationId}`,
        )
    }

    return settings
}

export async function updateOrganizationSettings(data: {
    organizationId: string
    accuracyThreshold: number
    regularAccuracyThreshold: number
}): Promise<OrganizationSettings> {
    const now = new Date()
    const [settings] = await db
        .insert(organizationSettings)
        .values({
            organizationId: data.organizationId,
            accuracyThreshold: data.accuracyThreshold,
            regularAccuracyThreshold: data.regularAccuracyThreshold,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: organizationSettings.organizationId,
            set: {
                accuracyThreshold: data.accuracyThreshold,
                regularAccuracyThreshold: data.regularAccuracyThreshold,
                updatedAt: now,
            },
        })
        .returning()

    return settings!
}

export async function getOrCreateOrganizationByDomain(data: {
    domain: string
    name?: string
}): Promise<Organization> {
    const normalizedDomain = normalizeDomain(data.domain)
    const organizationName = data.name?.trim() || normalizedDomain
    const now = new Date()

    const [createdOrUpdated] = await db
        .insert(organization)
        .values({
            domain: normalizedDomain,
            name: organizationName,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: organization.domain,
            set: {
                updatedAt: now,
            },
        })
        .returning()

    await db
        .insert(organizationSettings)
        .values({
            organizationId: createdOrUpdated!.id,
            accuracyThreshold: 90,
            regularAccuracyThreshold: 30,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoNothing({
            target: organizationSettings.organizationId,
        })

    return createdOrUpdated!
}

export async function getOrganizationMembership(data: {
    organizationId: string
    userId: string
}): Promise<OrganizationMembership | undefined> {
    return await db.query.organizationUser.findFirst({
        where: and(
            eq(organizationUser.organizationId, data.organizationId),
            eq(organizationUser.userId, data.userId),
        ),
    })
}

export async function upsertOrganizationMembership(data: {
    organizationId: string
    userId: string
    role: OrganizationRole
    status: OrganizationUserState
    approvedByUserId?: string | null
    approvedAt?: Date | null
}): Promise<OrganizationMembership> {
    const now = new Date()
    const [membership] = await db
        .insert(organizationUser)
        .values({
            organizationId: data.organizationId,
            userId: data.userId,
            role: data.role,
            status: data.status,
            approvedByUserId: data.approvedByUserId ?? null,
            approvedAt: data.approvedAt ?? null,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [organizationUser.organizationId, organizationUser.userId],
            set: {
                role: data.role,
                status: data.status,
                approvedByUserId: data.approvedByUserId ?? null,
                approvedAt: data.approvedAt ?? null,
                updatedAt: now,
            },
        })
        .returning()

    return membership!
}

export async function countApprovedTeacherMemberships(
    organizationId: string,
): Promise<number> {
    const [result] = await db
        .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
        .from(organizationUser)
        .where(
            and(
                eq(organizationUser.organizationId, organizationId),
                eq(organizationUser.status, "APPROVED"),
                inArray(organizationUser.role, teacherRoles),
            ),
        )

    return result?.count ?? 0
}

export async function ensureTeacherMembershipOnConnect(data: {
    userId: string
    domain: string
    organizationName?: string
}): Promise<{
    organization: Organization
    membership: OrganizationMembership
    needsApproval: boolean
    isFirstTeacher: boolean
}> {
    const org = await getOrCreateOrganizationByDomain({
        domain: data.domain,
        name: data.organizationName,
    })
    const existingMembership = await getOrganizationMembership({
        organizationId: org.id,
        userId: data.userId,
    })
    const approvedTeacherCount = await countApprovedTeacherMemberships(org.id)
    const isFirstTeacher = approvedTeacherCount === 0

    if (
        existingMembership &&
        existingMembership.status === "APPROVED" &&
        teacherRoles.includes(existingMembership.role)
    ) {
        return {
            organization: org,
            membership: existingMembership,
            needsApproval: false,
            isFirstTeacher,
        }
    }

    if (isFirstTeacher) {
        const adminMembership = await upsertOrganizationMembership({
            organizationId: org.id,
            userId: data.userId,
            role: "ORG_ADMIN",
            status: "APPROVED",
            approvedByUserId: data.userId,
            approvedAt: new Date(),
        })

        return {
            organization: org,
            membership: adminMembership,
            needsApproval: false,
            isFirstTeacher: true,
        }
    }

    const pendingMembership = await upsertOrganizationMembership({
        organizationId: org.id,
        userId: data.userId,
        role: "TEACHER",
        status: "PENDING",
        approvedByUserId: null,
        approvedAt: null,
    })

    return {
        organization: org,
        membership: pendingMembership,
        needsApproval: true,
        isFirstTeacher: false,
    }
}

export async function isUserOrganizationAdmin(data: {
    organizationId: string
    userId: string
}): Promise<boolean> {
    const membership = await getOrganizationMembership(data)
    return membership?.status === "APPROVED" && membership.role === "ORG_ADMIN"
}

export async function isUserApprovedOrganizationTeacher(data: {
    organizationId: string
    userId: string
}): Promise<boolean> {
    const membership = await getOrganizationMembership(data)
    return (
        membership?.status === "APPROVED" &&
        teacherRoles.includes(membership.role)
    )
}

export async function approveTeacherMembership(data: {
    organizationId: string
    teacherUserId: string
    approvedByUserId: string
}): Promise<OrganizationMembership> {
    const isApproverAdmin = await isUserOrganizationAdmin({
        organizationId: data.organizationId,
        userId: data.approvedByUserId,
    })
    if (!isApproverAdmin) {
        throw new Error("Only organization admins can approve teachers")
    }

    const existingMembership = await getOrganizationMembership({
        organizationId: data.organizationId,
        userId: data.teacherUserId,
    })
    if (!existingMembership) {
        throw new Error("Membership not found")
    }

    return await upsertOrganizationMembership({
        organizationId: data.organizationId,
        userId: data.teacherUserId,
        role: existingMembership.role === "ORG_ADMIN" ? "ORG_ADMIN" : "TEACHER",
        status: "APPROVED",
        approvedByUserId: data.approvedByUserId,
        approvedAt: new Date(),
    })
}

export async function promoteTeacherToAdmin(data: {
    organizationId: string
    teacherUserId: string
    promotedByUserId: string
}): Promise<OrganizationMembership> {
    const isPromoterAdmin = await isUserOrganizationAdmin({
        organizationId: data.organizationId,
        userId: data.promotedByUserId,
    })
    if (!isPromoterAdmin) {
        throw new Error("Only organization admins can promote teachers")
    }

    const existingMembership = await getOrganizationMembership({
        organizationId: data.organizationId,
        userId: data.teacherUserId,
    })
    if (!existingMembership) {
        throw new Error("Membership not found")
    }

    if (existingMembership.role === "STUDENT") {
        throw new Error("Only teachers can be promoted to admin")
    }

    if (existingMembership.status !== "APPROVED") {
        throw new Error("Teacher must be approved before admin promotion")
    }

    return await upsertOrganizationMembership({
        organizationId: data.organizationId,
        userId: data.teacherUserId,
        role: "ORG_ADMIN",
        status: "APPROVED",
        approvedByUserId: data.promotedByUserId,
        approvedAt: existingMembership.approvedAt ?? new Date(),
    })
}

export async function hasAnotherApprovedOrganizationAdmin(data: {
    organizationId: string
    excludingUserId: string
}): Promise<boolean> {
    const [row] = await db
        .select({ userId: organizationUser.userId })
        .from(organizationUser)
        .where(
            and(
                eq(organizationUser.organizationId, data.organizationId),
                eq(organizationUser.role, "ORG_ADMIN"),
                eq(organizationUser.status, "APPROVED"),
                ne(organizationUser.userId, data.excludingUserId),
            ),
        )
        .limit(1)

    return row != null
}

export async function getApprovedOrganizationMembership(data: {
    organizationId: string
    userId: string
}): Promise<OrganizationMembership | undefined> {
    const membership = await getOrganizationMembership(data)
    if (!membership || membership.status !== "APPROVED") {
        return undefined
    }

    return membership
}

export async function getApprovedOrganizationForUser(
    userId: string,
): Promise<Organization | undefined> {
    const [row] = await db
        .select({
            org: organization,
        })
        .from(organizationUser)
        .innerJoin(
            organization,
            eq(organizationUser.organizationId, organization.id),
        )
        .where(
            and(
                eq(organizationUser.userId, userId),
                eq(organizationUser.status, "APPROVED"),
            ),
        )
        .limit(1)

    return row?.org
}

export async function hasPendingTeacherMembershipForUser(
    userId: string,
): Promise<boolean> {
    const [row] = await db
        .select({ membershipId: organizationUser.id })
        .from(organizationUser)
        .where(
            and(
                eq(organizationUser.userId, userId),
                eq(organizationUser.status, "PENDING"),
                inArray(organizationUser.role, teacherRoles),
            ),
        )
        .limit(1)

    return row != null
}

export async function syncTeacherCourseMappings(data: {
    organizationId: string
    teacherUserId: string
    courseIds: string[]
}): Promise<void> {
    const uniqueCourseIds = Array.from(
        new Set(
            data.courseIds.map(courseId => courseId.trim()).filter(Boolean),
        ),
    )
    const now = new Date()

    await db.transaction(async tx => {
        if (uniqueCourseIds.length === 0) {
            await tx
                .delete(courseTeacher)
                .where(
                    and(
                        eq(courseTeacher.organizationId, data.organizationId),
                        eq(courseTeacher.teacherUserId, data.teacherUserId),
                    ),
                )
            return
        }

        await tx
            .delete(courseTeacher)
            .where(
                and(
                    eq(courseTeacher.organizationId, data.organizationId),
                    eq(courseTeacher.teacherUserId, data.teacherUserId),
                    notInArray(courseTeacher.courseId, uniqueCourseIds),
                ),
            )

        await tx
            .insert(courseTeacher)
            .values(
                uniqueCourseIds.map(courseId => ({
                    organizationId: data.organizationId,
                    teacherUserId: data.teacherUserId,
                    courseId,
                    createdAt: now,
                    updatedAt: now,
                })),
            )
            .onConflictDoUpdate({
                target: [
                    courseTeacher.organizationId,
                    courseTeacher.courseId,
                    courseTeacher.teacherUserId,
                ],
                set: {
                    updatedAt: now,
                },
            })
    })
}

export async function listApprovedTeacherUserIdsForCourse(data: {
    organizationId: string
    courseId: string
}): Promise<string[]> {
    const rows = await db
        .select({
            teacherUserId: courseTeacher.teacherUserId,
        })
        .from(courseTeacher)
        .innerJoin(
            organizationUser,
            and(
                eq(
                    courseTeacher.organizationId,
                    organizationUser.organizationId,
                ),
                eq(courseTeacher.teacherUserId, organizationUser.userId),
            ),
        )
        .where(
            and(
                eq(courseTeacher.organizationId, data.organizationId),
                eq(courseTeacher.courseId, data.courseId),
                eq(organizationUser.status, "APPROVED"),
                inArray(organizationUser.role, teacherRoles),
            ),
        )

    return rows.map(row => row.teacherUserId)
}

export async function isUserApprovedTeacherForCourse(data: {
    organizationId: string
    courseId: string
    userId: string
}): Promise<boolean> {
    const [row] = await db
        .select({ userId: courseTeacher.teacherUserId })
        .from(courseTeacher)
        .innerJoin(
            organizationUser,
            and(
                eq(
                    courseTeacher.organizationId,
                    organizationUser.organizationId,
                ),
                eq(courseTeacher.teacherUserId, organizationUser.userId),
            ),
        )
        .where(
            and(
                eq(courseTeacher.organizationId, data.organizationId),
                eq(courseTeacher.courseId, data.courseId),
                eq(courseTeacher.teacherUserId, data.userId),
                eq(organizationUser.status, "APPROVED"),
                inArray(organizationUser.role, teacherRoles),
            ),
        )
        .limit(1)

    return row != null
}

export async function listPendingTeacherMemberships(
    organizationId: string,
): Promise<
    Array<
        OrganizationMembership & {
            user: Pick<User, "id" | "email" | "name">
        }
    >
> {
    const rows = await db
        .select({
            membership: organizationUser,
            user: {
                id: users.id,
                email: users.email,
                name: users.name,
            },
        })
        .from(organizationUser)
        .innerJoin(users, eq(organizationUser.userId, users.id))
        .where(
            and(
                eq(organizationUser.organizationId, organizationId),
                eq(organizationUser.status, "PENDING"),
                eq(organizationUser.role, "TEACHER"),
            ),
        )

    return rows.map(row => ({
        ...row.membership,
        user: row.user,
    }))
}

export type OrganizationDirectoryUser = {
    userId: string
    email: string
    name: string | null
    role: OrganizationRole
    status: OrganizationUserState
    approvedAt: string | null
    hasTeacherConnection: boolean
    hasStudentConnection: boolean
}

export async function listOrganizationDirectoryUsers(
    organizationId: string,
): Promise<OrganizationDirectoryUser[]> {
    const rows = await db
        .select({
            userId: users.id,
            email: users.email,
            name: users.name,
            role: organizationUser.role,
            status: organizationUser.status,
            approvedAt: organizationUser.approvedAt,
            teacherTokenUserId: classroomTeacherToken.userId,
            studentTokenUserId: classroomStudentToken.userId,
        })
        .from(organizationUser)
        .innerJoin(users, eq(organizationUser.userId, users.id))
        .leftJoin(
            classroomTeacherToken,
            eq(classroomTeacherToken.userId, users.id),
        )
        .leftJoin(
            classroomStudentToken,
            eq(classroomStudentToken.userId, users.id),
        )
        .where(eq(organizationUser.organizationId, organizationId))

    return rows.map(row => ({
        userId: row.userId,
        email: row.email,
        name: row.name ?? null,
        role: row.role,
        status: row.status,
        approvedAt: row.approvedAt?.toISOString() ?? null,
        hasTeacherConnection: row.teacherTokenUserId != null,
        hasStudentConnection: row.studentTokenUserId != null,
    }))
}
