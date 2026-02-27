import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/db"
import {
    accounts,
    classroomAssignment,
    classroomStudentToken,
    classroomSubmission,
    classroomTeacherToken,
    sessions,
    users,
} from "~/server/db/schema"

import {
    AdminAccountError,
    deactivateUserAccount,
} from "./adminAccount.repository"

describe("AdminAccountRepository - Integration Tests", () => {
    let createdUserIds: string[]

    beforeEach(() => {
        createdUserIds = []
    })

    afterEach(async () => {
        for (const userId of createdUserIds) {
            await db
                .delete(classroomSubmission)
                .where(eq(classroomSubmission.studentUserId, userId))
            await db
                .delete(classroomAssignment)
                .where(eq(classroomAssignment.teacherUserId, userId))
            await db
                .delete(classroomTeacherToken)
                .where(eq(classroomTeacherToken.userId, userId))
            await db
                .delete(classroomStudentToken)
                .where(eq(classroomStudentToken.userId, userId))
            await db.delete(accounts).where(eq(accounts.userId, userId))
            await db.delete(sessions).where(eq(sessions.userId, userId))
            await db.delete(users).where(eq(users.id, userId))
        }
    })

    async function createUser(overrides?: {
        email?: string
        name?: string
        hashedPassword?: string | null
        deactivatedAt?: Date | null
    }): Promise<string> {
        const userId = crypto.randomUUID()
        createdUserIds.push(userId)

        await db.insert(users).values({
            id: userId,
            email: overrides?.email ?? `user-${userId}@example.com`,
            name: overrides?.name ?? "Test User",
            hashedPassword: overrides?.hashedPassword ?? "hashed-password",
            deactivatedAt: overrides?.deactivatedAt ?? null,
        })

        return userId
    }

    it("deactivates a vanilla user and unlinks auth records", async () => {
        const adminUserId = await createUser({
            email: "admin@example.com",
            name: "Admin User",
        })
        const targetUserId = await createUser({
            email: "student@example.com",
            name: "Student User",
            hashedPassword: "secret-hash",
        })

        await db.insert(accounts).values({
            userId: targetUserId,
            type: "oauth",
            provider: "google",
            providerAccountId: `google-${targetUserId}`,
        })
        await db.insert(sessions).values({
            sessionToken: `session-${targetUserId}`,
            userId: targetUserId,
            expires: new Date(Date.now() + 60_000),
        })
        await db.insert(classroomTeacherToken).values({
            userId: targetUserId,
            accessToken: "teacher-access",
            refreshToken: "teacher-refresh",
            expiresAt: new Date(Date.now() + 60_000),
            scope: "scope",
        })
        await db.insert(classroomStudentToken).values({
            userId: targetUserId,
            googleUserId: `google-user-${targetUserId}`,
            accessToken: "student-access",
            refreshToken: "student-refresh",
            expiresAt: new Date(Date.now() + 60_000),
            scope: "scope",
        })

        const result = await deactivateUserAccount({
            adminUserId,
            targetUserId,
        })

        expect(result.userId).toBe(targetUserId)
        expect(result.message).toBe("User account was deactivated.")

        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, targetUserId),
        })
        expect(targetUser).toBeDefined()
        expect(targetUser?.deactivatedAt).not.toBeNull()
        expect(targetUser?.hashedPassword).toBeNull()
        expect(targetUser?.emailVerified).toBeNull()
        expect(targetUser?.image).toBeNull()
        expect(targetUser?.email.includes("+deactivated+")).toBe(true)
        expect(targetUser?.name?.endsWith(" (deactivated)")).toBe(true)

        const [remainingAccount, remainingSession, remainingTeacherToken] =
            await Promise.all([
                db.query.accounts.findFirst({
                    where: eq(accounts.userId, targetUserId),
                }),
                db.query.sessions.findFirst({
                    where: eq(sessions.userId, targetUserId),
                }),
                db.query.classroomTeacherToken.findFirst({
                    where: eq(classroomTeacherToken.userId, targetUserId),
                }),
            ])
        const remainingStudentToken =
            await db.query.classroomStudentToken.findFirst({
                where: eq(classroomStudentToken.userId, targetUserId),
            })

        expect(remainingAccount).toBeUndefined()
        expect(remainingSession).toBeUndefined()
        expect(remainingTeacherToken).toBeUndefined()
        expect(remainingStudentToken).toBeUndefined()
    })

    it("rejects deactivation when user has student submissions", async () => {
        const adminUserId = await createUser({
            email: "admin-submissions@example.com",
        })
        const targetUserId = await createUser({
            email: "student-submissions@example.com",
        })
        const teacherUserId = await createUser({
            email: "teacher-submissions@example.com",
        })

        const assignmentId = crypto.randomUUID()
        await db.insert(classroomAssignment).values({
            id: assignmentId,
            teacherUserId,
            courseId: "course-1",
            courseWorkId: "coursework-1",
            title: "Test Assignment",
            translation: "esv",
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 3,
            totalVerses: 3,
            maxPoints: 100,
            state: "PUBLISHED",
        })
        await db.insert(classroomSubmission).values({
            assignmentId,
            studentUserId: targetUserId,
            totalVerses: 3,
        })

        await expect(
            deactivateUserAccount({
                adminUserId,
                targetUserId,
            }),
        ).rejects.toBeInstanceOf(AdminAccountError)
        await expect(
            deactivateUserAccount({
                adminUserId,
                targetUserId,
            }),
        ).rejects.toMatchObject({
            statusCode: 409,
            message:
                "This user cannot be deactivated because they have classroom assignment data.",
        })

        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, targetUserId),
        })
        expect(targetUser?.deactivatedAt).toBeNull()
    })

    it("rejects deactivation when user has teacher assignments", async () => {
        const adminUserId = await createUser({
            email: "admin-assignments@example.com",
        })
        const targetUserId = await createUser({
            email: "teacher-assignments@example.com",
        })

        await db.insert(classroomAssignment).values({
            teacherUserId: targetUserId,
            courseId: "course-2",
            courseWorkId: "coursework-2",
            title: "Teacher Assignment",
            translation: "esv",
            book: "exodus",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 2,
            totalVerses: 2,
            maxPoints: 100,
            state: "PUBLISHED",
        })

        await expect(
            deactivateUserAccount({
                adminUserId,
                targetUserId,
            }),
        ).rejects.toMatchObject({
            statusCode: 409,
            message:
                "This user cannot be deactivated because they have classroom assignment data.",
        })

        const targetUser = await db.query.users.findFirst({
            where: eq(users.id, targetUserId),
        })
        expect(targetUser?.deactivatedAt).toBeNull()
    })

    it("rejects deactivation when user is already deactivated", async () => {
        const adminUserId = await createUser({
            email: "admin-deactivated@example.com",
        })
        const targetUserId = await createUser({
            email: "already-deactivated@example.com",
            deactivatedAt: new Date(),
        })

        await expect(
            deactivateUserAccount({
                adminUserId,
                targetUserId,
            }),
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "User is already deactivated.",
        })
    })
})
