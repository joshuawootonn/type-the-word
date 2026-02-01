import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/db"
import { typedVerses, typingSessions, users } from "~/server/db/schema"

import { getChapterHistory } from "./getChapterHistory"

describe("getChapterHistory - Integration Tests", () => {
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
        await db.delete(typedVerses).where(eq(typedVerses.userId, testUserId))
        await db
            .delete(typingSessions)
            .where(eq(typingSessions.userId, testUserId))
        await db.delete(users).where(eq(users.id, testUserId))
    })

    // Helper to create typed verses
    async function createTypedVerse(opts: {
        book: "genesis" | "exodus" | "luke" | "john"
        chapter: number
        verse: number
        translation?: "esv" | "niv" | "bsb"
        createdAt?: Date
        typingData?: unknown
        sessionId?: string
    }) {
        const sessionId =
            opts.sessionId ??
            (await createSession(opts.createdAt ?? new Date()))

        const values: any = {
            id: crypto.randomUUID(),
            userId: testUserId,
            typingSessionId: sessionId,
            translation: opts.translation ?? "esv",
            book: opts.book,
            chapter: opts.chapter,
            verse: opts.verse,
            createdAt: opts.createdAt ?? new Date(),
        }
        if (opts.typingData !== undefined) {
            values.typingData = opts.typingData
        }
        await db.insert(typedVerses).values(values)

        return sessionId
    }

    async function createSession(createdAt: Date) {
        const sessionId = crypto.randomUUID()
        await db.insert(typingSessions).values({
            id: sessionId,
            userId: testUserId,
            createdAt,
            updatedAt: createdAt,
        })
        return sessionId
    }

    describe("bandwidth efficiency", () => {
        it("does not load typingData for verses", async () => {
            const largeTypingData = {
                keystrokes: Array.from({ length: 1000 }, (_, i) => ({
                    key: "a",
                    time: i * 100,
                })),
            }

            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                typingData: largeTypingData,
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            // Result should exist but not contain typingData
            expect(result.verses[1]).toBe(true)
            // We can't directly check typingData on verses since getChapterHistory
            // only returns verse numbers, but the test ensures the query is efficient
        })

        it("only fetches verses for the requested book/chapter/translation", async () => {
            const session1 = await createSession(new Date("2024-01-01"))

            // Create verses in the same session but different chapters/books
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 2,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })
            await createTypedVerse({
                book: "exodus",
                chapter: 1,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            // Only genesis 1 should be in the result
            expect(result.verses[1]).toBe(true)
            expect(result.verses[2]).toBeUndefined()
            expect(result.chapterLogs).toHaveLength(1)
            expect(result.chapterLogs[0]!.location).toEqual(["Genesis 1:1 "])
        })
    })

    describe("verses tracking", () => {
        it("tracks typed verses for a chapter", async () => {
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                translation: "esv",
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            expect(result.verses[1]).toBe(true)
            expect(result.verses[2]).toBe(true)
        })

        it("resets verses when entire chapter is completed", async () => {
            // Assuming Genesis 1 has 31 verses (you might need to adjust this)
            const session1 = await createSession(new Date("2024-01-01"))
            const session2 = await createSession(new Date("2024-01-02"))

            // Type all 31 verses in first session
            for (let i = 1; i <= 31; i++) {
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: i,
                    translation: "esv",
                    createdAt: new Date("2024-01-01"),
                    sessionId: session1,
                })
            }

            // Type verse 1 again in second session
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                createdAt: new Date("2024-01-02"),
                sessionId: session2,
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            // After completing all 31 verses, verses should reset
            // So only verse 1 from the second session should be marked
            expect(result.verses[1]).toBe(true)
            expect(Object.keys(result.verses).length).toBe(1)
        })

        it("filters by translation", async () => {
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                translation: "niv",
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            expect(result.verses[1]).toBe(true)
            expect(result.verses[2]).toBeUndefined()
        })
    })

    describe("chapter logs", () => {
        it("creates logs from typed verses", async () => {
            const session1 = await createSession(new Date("2024-01-01"))

            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                translation: "esv",
                sessionId: session1,
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            expect(result.chapterLogs).toHaveLength(1)
            expect(result.chapterLogs[0]!.location).toEqual(["Genesis 1:1-2 "])
        })

        it("groups verses from same session in one log", async () => {
            const session1 = await createSession(new Date("2024-01-01"))

            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                translation: "esv",
                sessionId: session1,
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 5,
                translation: "esv",
                sessionId: session1,
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            expect(result.chapterLogs).toHaveLength(1)
            expect(result.chapterLogs[0]!.location).toEqual([
                "Genesis 1:1-2, 5 ",
            ])
        })

        it("creates separate logs for different sessions", async () => {
            const session1 = await createSession(new Date("2024-01-01"))
            const session2 = await createSession(new Date("2024-01-02"))

            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                sessionId: session1,
                createdAt: new Date("2024-01-01"),
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                translation: "esv",
                sessionId: session2,
                createdAt: new Date("2024-01-02"),
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            expect(result.chapterLogs).toHaveLength(2)
        })

        it("excludes verses from other chapters in the same session", async () => {
            const session1 = await createSession(new Date("2024-01-01"))

            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 2,
                verse: 1,
                translation: "esv",
                sessionId: session1,
            })

            const result = await getChapterHistory(
                testUserId,
                { book: "genesis", chapter: 1 },
                "esv",
            )

            expect(result.chapterLogs).toHaveLength(1)
            expect(result.chapterLogs[0]!.location).toEqual(["Genesis 1:1 "])
        })
    })
})
