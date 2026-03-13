import { getCourseWork } from "~/server/clients/classroom.client"
import { type Book } from "~/server/db/schema"

import { listStudentCourses } from "../clients/classroom.client"
import {
    getTeacherToken,
    getStudentCoursePassageAssignmentMatch,
    getStudentPassageAssignmentMatch,
    getStudentToken,
    type StudentPassageAssignmentMatch,
    updateAssignmentFromClassroomSync,
} from "./classroom.repository"
import { getValidStudentToken } from "./student-token"

export const ASSIGNMENT_SYNC_MIN_INTERVAL_MS = 3 * 60 * 1000
export const ASSIGNMENT_SYNC_MAX_AGE_MONTHS = 3

export type AssignmentToSync = {
    id: string
    courseId: string
    courseWorkId: string
    title: string
    description: string | null
    dueDate: Date | null
    state: "DRAFT" | "PUBLISHED" | "DELETED"
    createdAt: Date
    lastSyncedAt: Date | null
}

export function isAssignmentSyncEligible(
    assignment: Pick<AssignmentToSync, "createdAt" | "lastSyncedAt">,
    now: Date,
): boolean {
    const recentlySyncedCutoff = new Date(
        now.getTime() - ASSIGNMENT_SYNC_MIN_INTERVAL_MS,
    )
    const oldestAllowedCreatedAt = new Date(now)
    oldestAllowedCreatedAt.setMonth(
        oldestAllowedCreatedAt.getMonth() - ASSIGNMENT_SYNC_MAX_AGE_MONTHS,
    )

    if (assignment.createdAt < oldestAllowedCreatedAt) {
        return false
    }

    return (
        assignment.lastSyncedAt == null ||
        assignment.lastSyncedAt < recentlySyncedCutoff
    )
}

export async function syncAssignmentsIfEligible<T extends AssignmentToSync>(
    accessToken: string,
    assignments: T[],
    now = new Date(),
): Promise<T[]> {
    return await Promise.all(
        assignments.map(async assignment => {
            if (!isAssignmentSyncEligible(assignment, now)) {
                return assignment
            }

            try {
                const courseWork = await getCourseWork(
                    accessToken,
                    assignment.courseId,
                    assignment.courseWorkId,
                )

                let dueDate: Date | null = null
                if (courseWork.dueDate) {
                    const hours = courseWork.dueTime?.hours ?? 23
                    const minutes = courseWork.dueTime?.minutes ?? 59
                    dueDate = new Date(
                        courseWork.dueDate.year,
                        courseWork.dueDate.month - 1,
                        courseWork.dueDate.day,
                        hours,
                        minutes,
                    )
                }

                const state =
                    courseWork.state === "DRAFT" ||
                    courseWork.state === "PUBLISHED" ||
                    courseWork.state === "DELETED"
                        ? courseWork.state
                        : assignment.state

                const syncedAssignment = {
                    ...assignment,
                    title: courseWork.title ?? assignment.title,
                    description:
                        courseWork.description ?? assignment.description,
                    dueDate: dueDate ?? assignment.dueDate,
                    state,
                    lastSyncedAt: now,
                }

                await updateAssignmentFromClassroomSync({
                    assignmentId: syncedAssignment.id,
                    title: syncedAssignment.title,
                    description: syncedAssignment.description,
                    dueDate: syncedAssignment.dueDate,
                    state: syncedAssignment.state,
                    lastSyncedAt: now,
                })

                return syncedAssignment
            } catch (_error) {
                return assignment
            }
        }),
    )
}

export async function syncAssignmentIfEligible<T extends AssignmentToSync>(
    accessToken: string,
    assignment: T,
    now = new Date(),
): Promise<T> {
    const [syncedAssignment] = await syncAssignmentsIfEligible(
        accessToken,
        [assignment],
        now,
    )

    return syncedAssignment ?? assignment
}

export async function getPassageAssignmentWarningMatch(data: {
    userId: string
    book: Book
    chapter: number
}): Promise<StudentPassageAssignmentMatch | undefined> {
    const [studentToken, teacherToken] = await Promise.all([
        getStudentToken(data.userId).catch(() => null),
        getTeacherToken(data.userId).catch(() => null),
    ])

    // Users without any classroom token are not connected to Classroom.
    if (!studentToken && !teacherToken) {
        return undefined
    }

    // Assignment progress warnings only apply to student assignment work.
    if (!studentToken) {
        return undefined
    }

    const submissionMatch = await getStudentPassageAssignmentMatch({
        studentUserId: data.userId,
        book: data.book,
        chapter: data.chapter,
    })

    if (submissionMatch) {
        try {
            const token = await getValidStudentToken(data.userId)
            const syncedMatch = await syncAssignmentIfEligible(
                token.accessToken,
                submissionMatch,
            )

            if (syncedMatch) {
                return syncedMatch
            }
        } catch (_error) {
            // If sync fails, preserve existing behavior and show the local match.
            return submissionMatch
        }
    }

    try {
        const token = await getValidStudentToken(data.userId)
        const courses = await listStudentCourses(token.accessToken)
        const courseMatch = await getStudentCoursePassageAssignmentMatch({
            studentUserId: data.userId,
            courseIds: courses.map(course => course.id),
            book: data.book,
            chapter: data.chapter,
        })

        if (!courseMatch) {
            return undefined
        }

        const syncedMatch = await syncAssignmentIfEligible(
            token.accessToken,
            courseMatch,
        )
        return syncedMatch
    } catch (_error) {
        return undefined
    }
}
