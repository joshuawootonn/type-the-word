import {
    getApprovedOrganizationForUser,
    isUserApprovedTeacherForCourse,
    listApprovedTeacherUserIdsForCourse,
} from "~/server/repositories/organization.repository"

import { getValidTeacherToken } from "./teacher-token"

type AssignmentAccessRecord = {
    organizationId: string | null
    courseId: string
    teacherUserId: string
}

export async function getTeacherOrganizationId(
    userId: string,
): Promise<string | null> {
    const organization = await getApprovedOrganizationForUser(userId)
    return organization?.id ?? null
}

export async function canTeacherAccessCourse(data: {
    userId: string
    courseId: string
}): Promise<{ allowed: boolean; organizationId: string | null }> {
    const organizationId = await getTeacherOrganizationId(data.userId)
    if (!organizationId) {
        return { allowed: false, organizationId: null }
    }

    const allowed = await isUserApprovedTeacherForCourse({
        organizationId,
        courseId: data.courseId,
        userId: data.userId,
    })

    return {
        allowed,
        organizationId,
    }
}

export async function canTeacherAccessAssignment(data: {
    userId: string
    assignment: AssignmentAccessRecord
}): Promise<boolean> {
    if (!data.assignment.organizationId) {
        return data.assignment.teacherUserId === data.userId
    }

    return await isUserApprovedTeacherForCourse({
        organizationId: data.assignment.organizationId,
        courseId: data.assignment.courseId,
        userId: data.userId,
    })
}

export async function getTeacherTokenForAssignment(
    assignment: AssignmentAccessRecord,
): Promise<Awaited<ReturnType<typeof getValidTeacherToken>>> {
    if (!assignment.organizationId) {
        return await getValidTeacherToken(assignment.teacherUserId)
    }

    const teacherUserIds = await listApprovedTeacherUserIdsForCourse({
        organizationId: assignment.organizationId,
        courseId: assignment.courseId,
    })
    const preferredTeacherIds = Array.from(
        new Set([assignment.teacherUserId, ...teacherUserIds]),
    )

    for (const teacherUserId of preferredTeacherIds) {
        try {
            return await getValidTeacherToken(teacherUserId)
        } catch {
            // Continue looking for another course teacher with valid tokens.
        }
    }

    throw new Error("No connected teacher token available for this course")
}
