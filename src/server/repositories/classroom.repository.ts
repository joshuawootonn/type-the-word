import { eq, and } from "drizzle-orm"

import { db } from "~/server/db"
import {
    classroomTeacherToken,
    classroomAssignment,
    classroomSubmission,
    type Translation,
    type Book,
} from "~/server/db/schema"

/**
 * Teacher Token Operations
 */

export async function getTeacherToken(userId: string) {
    const token = await db.query.classroomTeacherToken.findFirst({
        where: eq(classroomTeacherToken.userId, userId),
    })
    return token
}

export async function saveTeacherToken(data: {
    userId: string
    accessToken: string
    refreshToken: string
    expiresAt: Date
    scope: string
}) {
    await db
        .insert(classroomTeacherToken)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: classroomTeacherToken.userId,
            set: {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.expiresAt,
                scope: data.scope,
                updatedAt: new Date(),
            },
        })
}

export async function updateTeacherTokenAccess(
    userId: string,
    accessToken: string,
    expiresAt: Date,
) {
    await db
        .update(classroomTeacherToken)
        .set({
            accessToken,
            expiresAt,
            updatedAt: new Date(),
        })
        .where(eq(classroomTeacherToken.userId, userId))
}

export async function deleteTeacherToken(userId: string) {
    await db
        .delete(classroomTeacherToken)
        .where(eq(classroomTeacherToken.userId, userId))
}

/**
 * Assignment Operations
 */

export async function createAssignment(data: {
    id?: string
    teacherUserId: string
    courseId: string
    courseWorkId: string
    title: string
    description?: string
    translation: Translation
    book: Book
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
    totalVerses: number
    maxPoints: number
    dueDate?: Date
    state?: "DRAFT" | "PUBLISHED" | "DELETED"
}) {
    const [assignment] = await db
        .insert(classroomAssignment)
        .values({
            ...data,
            state: data.state || "DRAFT",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning()

    return assignment!
}

export async function updateAssignmentState(
    assignmentId: string,
    state: "DRAFT" | "PUBLISHED" | "DELETED",
) {
    await db
        .update(classroomAssignment)
        .set({
            state,
            updatedAt: new Date(),
        })
        .where(eq(classroomAssignment.id, assignmentId))
}

export async function getAssignment(assignmentId: string) {
    const assignment = await db.query.classroomAssignment.findFirst({
        where: eq(classroomAssignment.id, assignmentId),
    })
    return assignment
}

export async function getAssignmentByTeacher(
    teacherUserId: string,
    courseId?: string,
) {
    if (courseId) {
        return await db.query.classroomAssignment.findMany({
            where: and(
                eq(classroomAssignment.teacherUserId, teacherUserId),
                eq(classroomAssignment.courseId, courseId),
            ),
            orderBy: (table, { desc }) => [desc(table.createdAt)],
        })
    }

    return await db.query.classroomAssignment.findMany({
        where: eq(classroomAssignment.teacherUserId, teacherUserId),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
    })
}

/**
 * Submission Operations
 */

export async function getOrCreateSubmission(data: {
    assignmentId: string
    studentUserId: string
    totalVerses: number
    submissionId?: string
}) {
    // Try to find existing submission
    const existing = await db.query.classroomSubmission.findFirst({
        where: and(
            eq(classroomSubmission.assignmentId, data.assignmentId),
            eq(classroomSubmission.studentUserId, data.studentUserId),
        ),
    })

    if (existing) {
        if (
            data.submissionId != null &&
            existing.submissionId !== data.submissionId
        ) {
            const [updated] = await db
                .update(classroomSubmission)
                .set({
                    submissionId: data.submissionId,
                    updatedAt: new Date(),
                })
                .where(eq(classroomSubmission.id, existing.id))
                .returning()

            return updated ?? existing
        }

        return existing
    }

    // Create new submission
    const [submission] = await db
        .insert(classroomSubmission)
        .values({
            ...data,
            completedVerses: 0,
            startedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning()

    return submission!
}

export async function updateSubmissionProgress(
    submissionId: string,
    data: {
        completedVerses: number
        averageWpm?: number
        averageAccuracy?: number
        isCompleted?: boolean
        grade?: number
    },
) {
    const updateData = {
        completedVerses: data.completedVerses,
        averageWpm: data.averageWpm,
        averageAccuracy: data.averageAccuracy,
        isCompleted: data.isCompleted ? 1 : 0,
        grade: data.grade,
        completedAt: data.isCompleted ? new Date() : undefined,
        updatedAt: new Date(),
    }

    await db
        .update(classroomSubmission)
        .set(updateData)
        .where(eq(classroomSubmission.id, submissionId))
}

export async function markSubmissionTurnedIn(submissionId: string) {
    await db
        .update(classroomSubmission)
        .set({
            isTurnedIn: 1,
            turnedInAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(classroomSubmission.id, submissionId))
}

export async function getSubmissionsByAssignment(assignmentId: string) {
    return await db.query.classroomSubmission.findMany({
        where: eq(classroomSubmission.assignmentId, assignmentId),
        with: {
            student: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    })
}

export async function getSubmissionByStudent(
    assignmentId: string,
    studentUserId: string,
) {
    return await db.query.classroomSubmission.findFirst({
        where: and(
            eq(classroomSubmission.assignmentId, assignmentId),
            eq(classroomSubmission.studentUserId, studentUserId),
        ),
    })
}
