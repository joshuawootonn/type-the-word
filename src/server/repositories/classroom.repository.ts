import { and, eq, sql } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import * as schema from '~/server/db/schema'

export class ClassroomRepository {
    db: PostgresJsDatabase<typeof schema>

    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    // =========================================================================
    // Teacher Token Management
    // =========================================================================

    async upsertTeacherToken(data: {
        userId: string
        googleId: string
        accessToken: string
        refreshToken?: string | null
        expiresAt?: Date | null
        scope?: string | null
    }) {
        const [result] = await this.db
            .insert(schema.classroomTeacherToken)
            .values({
                userId: data.userId,
                googleId: data.googleId,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.expiresAt,
                scope: data.scope,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: schema.classroomTeacherToken.userId,
                set: {
                    googleId: data.googleId,
                    accessToken: data.accessToken,
                    refreshToken:
                        data.refreshToken ??
                        sql`${schema.classroomTeacherToken.refreshToken}`,
                    expiresAt: data.expiresAt,
                    scope: data.scope,
                    updatedAt: new Date(),
                },
            })
            .returning()

        return result
    }

    async getTeacherToken(userId: string) {
        return this.db.query.classroomTeacherToken.findFirst({
            where: eq(schema.classroomTeacherToken.userId, userId),
        })
    }

    async deleteTeacherToken(userId: string) {
        await this.db
            .delete(schema.classroomTeacherToken)
            .where(eq(schema.classroomTeacherToken.userId, userId))
    }

    // =========================================================================
    // Assignment Management
    // =========================================================================

    async createAssignment(data: {
        integrationType: 'coursework' | 'addon'
        courseId: string
        courseWorkId?: string | null
        attachmentId?: string | null
        itemId?: string | null
        teacherGoogleId: string
        teacherUserId?: string | null
        translation: schema.Translation
        book: schema.Book
        chapter: number
        firstVerse?: number | null
        lastVerse?: number | null
        title?: string | null
        maxPoints?: number
    }) {
        const [result] = await this.db
            .insert(schema.classroomAssignment)
            .values({
                integrationType: data.integrationType,
                courseId: data.courseId,
                courseWorkId: data.courseWorkId,
                attachmentId: data.attachmentId,
                itemId: data.itemId,
                teacherGoogleId: data.teacherGoogleId,
                teacherUserId: data.teacherUserId,
                translation: data.translation,
                book: data.book,
                chapter: data.chapter,
                firstVerse: data.firstVerse,
                lastVerse: data.lastVerse,
                title: data.title,
                maxPoints: data.maxPoints ?? 100,
            })
            .returning()

        return result!
    }

    async getAssignment(id: string) {
        return this.db.query.classroomAssignment.findFirst({
            where: eq(schema.classroomAssignment.id, id),
            with: {
                submissions: true,
            },
        })
    }

    async getAssignmentByCourseWorkId(courseWorkId: string) {
        return this.db.query.classroomAssignment.findFirst({
            where: eq(schema.classroomAssignment.courseWorkId, courseWorkId),
            with: {
                submissions: true,
            },
        })
    }

    async getAssignmentByAttachmentId(attachmentId: string) {
        return this.db.query.classroomAssignment.findFirst({
            where: eq(schema.classroomAssignment.attachmentId, attachmentId),
            with: {
                submissions: true,
            },
        })
    }

    async getAssignmentsByTeacher(teacherUserId: string) {
        return this.db.query.classroomAssignment.findMany({
            where: eq(schema.classroomAssignment.teacherUserId, teacherUserId),
            with: {
                submissions: true,
            },
            orderBy: (assignment, { desc }) => [desc(assignment.createdAt)],
        })
    }

    // =========================================================================
    // Submission Management
    // =========================================================================

    async upsertSubmission(data: {
        assignmentId: string
        studentGoogleId: string
        studentUserId?: string | null
        googleSubmissionId?: string | null
        versesCompleted: number
        totalVerses: number
        averageWpm?: number | null
        averageAccuracy?: number | null
        completedAt?: Date | null
        grade?: number | null
        gradeSubmittedAt?: Date | null
    }) {
        // Check if submission exists
        const existing = await this.db.query.classroomSubmission.findFirst({
            where: and(
                eq(schema.classroomSubmission.assignmentId, data.assignmentId),
                eq(
                    schema.classroomSubmission.studentGoogleId,
                    data.studentGoogleId,
                ),
            ),
        })

        if (existing) {
            const [result] = await this.db
                .update(schema.classroomSubmission)
                .set({
                    studentUserId: data.studentUserId ?? existing.studentUserId,
                    googleSubmissionId:
                        data.googleSubmissionId ?? existing.googleSubmissionId,
                    versesCompleted: data.versesCompleted,
                    totalVerses: data.totalVerses,
                    averageWpm: data.averageWpm,
                    averageAccuracy: data.averageAccuracy,
                    completedAt: data.completedAt,
                    grade: data.grade,
                    gradeSubmittedAt: data.gradeSubmittedAt,
                    updatedAt: new Date(),
                })
                .where(eq(schema.classroomSubmission.id, existing.id))
                .returning()
            return result!
        }

        const [result] = await this.db
            .insert(schema.classroomSubmission)
            .values({
                assignmentId: data.assignmentId,
                studentGoogleId: data.studentGoogleId,
                studentUserId: data.studentUserId,
                googleSubmissionId: data.googleSubmissionId,
                versesCompleted: data.versesCompleted,
                totalVerses: data.totalVerses,
                averageWpm: data.averageWpm,
                averageAccuracy: data.averageAccuracy,
                completedAt: data.completedAt,
                grade: data.grade,
                gradeSubmittedAt: data.gradeSubmittedAt,
            })
            .returning()

        return result!
    }

    async getSubmission(assignmentId: string, studentGoogleId: string) {
        return this.db.query.classroomSubmission.findFirst({
            where: and(
                eq(schema.classroomSubmission.assignmentId, assignmentId),
                eq(schema.classroomSubmission.studentGoogleId, studentGoogleId),
            ),
        })
    }

    async getSubmissionsByAssignment(assignmentId: string) {
        return this.db.query.classroomSubmission.findMany({
            where: eq(schema.classroomSubmission.assignmentId, assignmentId),
            orderBy: (submission, { desc }) => [desc(submission.updatedAt)],
        })
    }

    async updateSubmissionGrade(
        submissionId: string,
        grade: number,
        gradeSubmittedAt: Date,
    ) {
        const [result] = await this.db
            .update(schema.classroomSubmission)
            .set({
                grade,
                gradeSubmittedAt,
                updatedAt: new Date(),
            })
            .where(eq(schema.classroomSubmission.id, submissionId))
            .returning()

        return result
    }
}
