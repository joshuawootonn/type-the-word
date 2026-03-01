import { eq } from "drizzle-orm"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "~/server/db"
import {
    classroomAssignment,
    classroomSubmission,
    typedVerses,
    typingSessions,
    userDailyActivity,
    users,
} from "~/server/db/schema"

vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}))

vi.mock("~/lib/auth/admin", () => ({
    isAdminEmail: vi.fn(),
}))

import { getServerSession } from "next-auth"

import { isAdminEmail } from "~/lib/auth/admin"

import { GET } from "./route"
import { adminUserSearchResponseSchema } from "./schemas"

describe("GET /api/admin/users/search", () => {
    let createdUserIds: string[]
    let createdTypingSessionIds: string[]
    let createdAssignmentIds: string[]

    beforeEach(() => {
        vi.clearAllMocks()
        createdUserIds = []
        createdTypingSessionIds = []
        createdAssignmentIds = []
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
                .delete(userDailyActivity)
                .where(eq(userDailyActivity.userId, userId))
            await db.delete(typedVerses).where(eq(typedVerses.userId, userId))
            await db
                .delete(typingSessions)
                .where(eq(typingSessions.userId, userId))
            await db.delete(users).where(eq(users.id, userId))
        }

        for (const sessionId of createdTypingSessionIds) {
            await db
                .delete(typedVerses)
                .where(eq(typedVerses.typingSessionId, sessionId))
            await db
                .delete(typingSessions)
                .where(eq(typingSessions.id, sessionId))
        }

        for (const assignmentId of createdAssignmentIds) {
            await db
                .delete(classroomSubmission)
                .where(eq(classroomSubmission.assignmentId, assignmentId))
            await db
                .delete(classroomAssignment)
                .where(eq(classroomAssignment.id, assignmentId))
        }
    })

    it("returns accurate activity stats for matched users", async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: "admin-id", email: "admin@example.com", name: "Admin" },
        })
        vi.mocked(isAdminEmail).mockReturnValue(true)

        const userId = crypto.randomUUID()
        createdUserIds.push(userId)
        await db.insert(users).values({
            id: userId,
            email: "activity-target@example.com",
            name: "Activity Target",
        })

        const otherUserId = crypto.randomUUID()
        createdUserIds.push(otherUserId)
        await db.insert(users).values({
            id: otherUserId,
            email: "different-user@example.com",
            name: "Different User",
        })

        const olderSessionCreatedAt = new Date("2025-01-05T12:00:00.000Z")
        const latestSessionCreatedAt = new Date("2025-01-10T15:00:00.000Z")

        const sessionOneId = crypto.randomUUID()
        const sessionTwoId = crypto.randomUUID()
        createdTypingSessionIds.push(sessionOneId, sessionTwoId)
        await db.insert(typingSessions).values([
            {
                id: sessionOneId,
                userId,
                createdAt: olderSessionCreatedAt,
                updatedAt: olderSessionCreatedAt,
            },
            {
                id: sessionTwoId,
                userId,
                createdAt: latestSessionCreatedAt,
                updatedAt: latestSessionCreatedAt,
            },
        ])

        await db.insert(typedVerses).values([
            {
                id: crypto.randomUUID(),
                userId,
                typingSessionId: sessionOneId,
                translation: "esv",
                book: "genesis",
                chapter: 1,
                verse: 1,
                createdAt: new Date("2025-01-05T12:01:00.000Z"),
            },
            {
                id: crypto.randomUUID(),
                userId,
                typingSessionId: sessionTwoId,
                translation: "esv",
                book: "genesis",
                chapter: 1,
                verse: 2,
                createdAt: new Date("2025-01-10T15:01:00.000Z"),
            },
            {
                id: crypto.randomUUID(),
                userId,
                typingSessionId: sessionTwoId,
                translation: "esv",
                book: "genesis",
                chapter: 1,
                verse: 3,
                createdAt: new Date("2025-01-10T15:02:00.000Z"),
            },
        ])

        const within30DateOne = new Date()
        within30DateOne.setUTCDate(within30DateOne.getUTCDate() - 1)
        within30DateOne.setUTCHours(0, 0, 0, 0)
        const within30DateTwo = new Date()
        within30DateTwo.setUTCDate(within30DateTwo.getUTCDate() - 7)
        within30DateTwo.setUTCHours(0, 0, 0, 0)
        const outside30Date = new Date()
        outside30Date.setUTCDate(outside30Date.getUTCDate() - 45)
        outside30Date.setUTCHours(0, 0, 0, 0)

        await db.insert(userDailyActivity).values([
            {
                userId,
                date: within30DateOne,
                verseCount: 2,
                passages: ["Genesis 1:1-2 (ESV)"],
            },
            {
                userId,
                date: within30DateTwo,
                verseCount: 3,
                passages: ["Genesis 1:3 (ESV)"],
            },
            {
                userId,
                date: outside30Date,
                verseCount: 99,
                passages: ["Genesis 2:1 (ESV)"],
            },
        ])

        const assignmentId = crypto.randomUUID()
        createdAssignmentIds.push(assignmentId)
        await db.insert(classroomAssignment).values({
            id: assignmentId,
            teacherUserId: userId,
            courseId: "course-1",
            courseWorkId: "coursework-1",
            title: "Assignment",
            translation: "esv",
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 3,
            totalVerses: 3,
            state: "PUBLISHED",
            maxPoints: 100,
        })

        const request = new NextRequest(
            "http://localhost/api/admin/users/search?q=activity-target",
        )
        const response = await GET(request)
        const json: unknown = await response.json()

        expect(response.status).toBe(200)
        const parsed = adminUserSearchResponseSchema.parse(json)
        expect(parsed.users.length).toBe(1)

        const user = parsed.users[0]!
        expect(user.id).toBe(userId)
        expect(user.typingSessionCount).toBe(2)
        expect(user.typedVerseCount).toBe(3)
        expect(user.versesTypedLast30).toBe(5)
        expect(user.activeDaysLast30).toBe(2)
        expect(user.hasClassroomData).toBe(true)
        expect(user.lastTypingSessionAt).not.toBeNull()
        expect(user.lastTypedVerseAt).not.toBeNull()
    })
})
