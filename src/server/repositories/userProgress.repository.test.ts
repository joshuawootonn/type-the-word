import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/db"
import {
    userBookProgress,
    userChapterProgress,
    users,
} from "~/server/db/schema"

import { UserProgressRepository } from "./userProgress.repository"

describe("UserProgressRepository - Integration Tests", () => {
    const repository = new UserProgressRepository(db)
    let testUserId: string

    beforeEach(async () => {
        // Create a test user
        testUserId = crypto.randomUUID()
        await db.insert(users).values({
            id: testUserId,
            email: `test-${testUserId}@example.com`,
            name: "Test User",
        })
    })

    afterEach(async () => {
        // Clean up test data
        await db
            .delete(userChapterProgress)
            .where(eq(userChapterProgress.userId, testUserId))
        await db
            .delete(userBookProgress)
            .where(eq(userBookProgress.userId, testUserId))
        await db.delete(users).where(eq(users.id, testUserId))
    })

    describe("getByUserId", () => {
        it("returns empty arrays when user has no progress for translation", async () => {
            const result = await repository.getByUserId(testUserId, "esv")

            expect(result.books).toEqual([])
            expect(result.chapters).toEqual([])
        })

        it("filters by translation when specified", async () => {
            // Insert progress for multiple translations
            await db.insert(userBookProgress).values([
                {
                    userId: testUserId,
                    book: "genesis",
                    translation: "esv",
                    prestige: 0,
                    typedVerseCount: 10,
                    totalVerses: 1533,
                },
                {
                    userId: testUserId,
                    book: "genesis",
                    translation: "niv",
                    prestige: 0,
                    typedVerseCount: 5,
                    totalVerses: 1533,
                },
                {
                    userId: testUserId,
                    book: "exodus",
                    translation: "esv",
                    prestige: 1,
                    typedVerseCount: 20,
                    totalVerses: 1213,
                },
            ])

            await db.insert(userChapterProgress).values([
                {
                    userId: testUserId,
                    book: "genesis",
                    chapter: 1,
                    translation: "esv",
                    typedVerses: { 1: true, 2: true },
                    typedVerseCount: 2,
                    totalVerses: 31,
                },
                {
                    userId: testUserId,
                    book: "genesis",
                    chapter: 1,
                    translation: "niv",
                    typedVerses: { 1: true },
                    typedVerseCount: 1,
                    totalVerses: 31,
                },
                {
                    userId: testUserId,
                    book: "exodus",
                    chapter: 1,
                    translation: "esv",
                    typedVerses: { 1: true, 2: true, 3: true },
                    typedVerseCount: 3,
                    totalVerses: 22,
                },
            ])

            // Filter by ESV
            const esvResult = await repository.getByUserId(testUserId, "esv")

            expect(esvResult.books).toHaveLength(2)
            expect(esvResult.books.every(b => b.translation === "esv")).toBe(
                true,
            )
            expect(esvResult.chapters).toHaveLength(2)
            expect(esvResult.chapters.every(c => c.translation === "esv")).toBe(
                true,
            )

            // Filter by NIV
            const nivResult = await repository.getByUserId(testUserId, "niv")

            expect(nivResult.books).toHaveLength(1)
            expect(nivResult.books[0]!.translation).toBe("niv")
            expect(nivResult.books[0]!.book).toBe("genesis")
            expect(nivResult.chapters).toHaveLength(1)
            expect(nivResult.chapters[0]!.translation).toBe("niv")
        })

        it("returns empty when filtering by translation with no matching data", async () => {
            // Insert only ESV progress
            await db.insert(userBookProgress).values({
                userId: testUserId,
                book: "genesis",
                translation: "esv",
                prestige: 0,
                typedVerseCount: 10,
                totalVerses: 1533,
            })

            // Filter by NIV (no data)
            const result = await repository.getByUserId(testUserId, "niv")

            expect(result.books).toEqual([])
            expect(result.chapters).toEqual([])
        })

        it("does not return data from other users", async () => {
            // Create another user
            const otherUserId = crypto.randomUUID()
            await db.insert(users).values({
                id: otherUserId,
                email: `other-${otherUserId}@example.com`,
                name: "Other User",
            })

            // Insert progress for both users
            await db.insert(userBookProgress).values([
                {
                    userId: testUserId,
                    book: "genesis",
                    translation: "esv",
                    prestige: 0,
                    typedVerseCount: 10,
                    totalVerses: 1533,
                },
                {
                    userId: otherUserId,
                    book: "exodus",
                    translation: "esv",
                    prestige: 0,
                    typedVerseCount: 20,
                    totalVerses: 1213,
                },
            ])

            const result = await repository.getByUserId(testUserId, "esv")

            expect(result.books).toHaveLength(1)
            expect(result.books[0]!.book).toBe("genesis")

            // Clean up other user
            await db
                .delete(userBookProgress)
                .where(eq(userBookProgress.userId, otherUserId))
            await db.delete(users).where(eq(users.id, otherUserId))
        })
    })
})
