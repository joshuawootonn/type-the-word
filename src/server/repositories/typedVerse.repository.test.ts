import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/db"
import { typedVerses, typingSessions, users } from "~/server/db/schema"

import { TypedVerseRepository } from "./typedVerse.repository"

describe("TypedVerseRepository - Integration Tests", () => {
    const repository = new TypedVerseRepository(db)
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
        userId?: string
    }) {
        const userId = opts.userId ?? testUserId
        const sessionId = crypto.randomUUID()
        await db.insert(typingSessions).values({
            id: sessionId,
            userId,
            createdAt: opts.createdAt ?? new Date(),
            updatedAt: opts.createdAt ?? new Date(),
        })

        const values: any = {
            id: crypto.randomUUID(),
            userId,
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
    }

    describe("getMany", () => {
        describe("translation filtering", () => {
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
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 3,
                    translation: "esv",
                })

                const result = await repository.getMany({
                    userId: testUserId,
                    translation: "esv",
                })

                expect(result).toHaveLength(2)
                expect(result.every(v => v.translation === "esv")).toBe(true)
            })

            it("filters by book, chapter, and translation", async () => {
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
                await createTypedVerse({
                    book: "genesis",
                    chapter: 2,
                    verse: 1,
                    translation: "esv",
                })
                await createTypedVerse({
                    book: "exodus",
                    chapter: 1,
                    verse: 1,
                    translation: "esv",
                })

                const result = await repository.getMany({
                    userId: testUserId,
                    book: "genesis",
                    chapter: 1,
                    translation: "esv",
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.book).toBe("genesis")
                expect(result[0]!.chapter).toBe(1)
                expect(result[0]!.translation).toBe("esv")
            })

            it("returns empty array when no verses match translation", async () => {
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 1,
                    translation: "esv",
                })

                const result = await repository.getMany({
                    userId: testUserId,
                    translation: "niv",
                })

                expect(result).toHaveLength(0)
            })
        })

        describe("excluding typingData", () => {
            it("excludes typingData when omitTypingData is true", async () => {
                const typingData = { keystrokes: [{ key: "a", time: 100 }] }
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 1,
                    typingData,
                })

                const result = await repository.getMany({
                    userId: testUserId,
                    omitTypingData: true,
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typingData).toBeNull()
            })

            it("includes typingData when omitTypingData is false", async () => {
                const typingData = { keystrokes: [{ key: "a", time: 100 }] }
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 1,
                    typingData,
                })

                const result = await repository.getMany({
                    userId: testUserId,
                    omitTypingData: false,
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typingData).not.toBeNull()
            })

            it("includes typingData by default (when omitTypingData not specified)", async () => {
                const typingData = { keystrokes: [{ key: "a", time: 100 }] }
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 1,
                    typingData,
                })

                const result = await repository.getMany({
                    userId: testUserId,
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typingData).not.toBeNull()
            })
        })

        describe("combined filtering with exclusions", () => {
            it("filters by book, chapter, translation and excludes typingData", async () => {
                const typingData = { keystrokes: [{ key: "a", time: 100 }] }
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 1,
                    translation: "esv",
                    typingData,
                })
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 2,
                    translation: "niv",
                    typingData,
                })

                const result = await repository.getMany({
                    userId: testUserId,
                    book: "genesis",
                    chapter: 1,
                    translation: "esv",
                    omitTypingData: true,
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.book).toBe("genesis")
                expect(result[0]!.chapter).toBe(1)
                expect(result[0]!.translation).toBe("esv")
                expect(result[0]!.typingData).toBeNull()
            })
        })
    })

    describe("getRecentTypingLocations", () => {
        it("keeps only the most recent verse per book/chapter/translation", async () => {
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                createdAt: new Date("2024-01-01T10:00:00Z"),
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                translation: "esv",
                createdAt: new Date("2024-01-01T11:00:00Z"),
            })

            const result = await repository.getRecentTypingLocations({
                userId: testUserId,
                limit: 5,
            })

            expect(result).toHaveLength(1)
            expect(result[0]!.book).toBe("genesis")
            expect(result[0]!.chapter).toBe(1)
            expect(result[0]!.translation).toBe("esv")
            expect(result[0]!.verse).toBe(2)
        })

        it("orders unique locations by recency", async () => {
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 2,
                createdAt: new Date("2024-01-01T10:00:00Z"),
            })
            await createTypedVerse({
                book: "exodus",
                chapter: 1,
                verse: 1,
                createdAt: new Date("2024-01-01T12:00:00Z"),
            })

            const result = await repository.getRecentTypingLocations({
                userId: testUserId,
                limit: 5,
            })

            expect(result).toHaveLength(2)
            expect(result[0]!.book).toBe("exodus")
            expect(result[1]!.book).toBe("genesis")
        })

        it("treats different translations as unique locations", async () => {
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "esv",
                createdAt: new Date("2024-01-01T10:00:00Z"),
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                translation: "niv",
                createdAt: new Date("2024-01-01T11:00:00Z"),
            })

            const result = await repository.getRecentTypingLocations({
                userId: testUserId,
                limit: 5,
            })

            expect(result).toHaveLength(2)
            expect(result.map(row => row.translation)).toEqual(["niv", "esv"])
        })

        it("applies the required limit to unique locations", async () => {
            await createTypedVerse({
                book: "genesis",
                chapter: 1,
                verse: 1,
                createdAt: new Date("2024-01-01T10:00:00Z"),
            })
            await createTypedVerse({
                book: "genesis",
                chapter: 2,
                verse: 1,
                createdAt: new Date("2024-01-01T11:00:00Z"),
            })
            await createTypedVerse({
                book: "exodus",
                chapter: 1,
                verse: 1,
                createdAt: new Date("2024-01-01T12:00:00Z"),
            })
            await createTypedVerse({
                book: "exodus",
                chapter: 2,
                verse: 1,
                createdAt: new Date("2024-01-01T13:00:00Z"),
            })
            await createTypedVerse({
                book: "luke",
                chapter: 1,
                verse: 1,
                createdAt: new Date("2024-01-01T14:00:00Z"),
            })
            await createTypedVerse({
                book: "john",
                chapter: 1,
                verse: 1,
                createdAt: new Date("2024-01-01T15:00:00Z"),
            })

            const result = await repository.getRecentTypingLocations({
                userId: testUserId,
                limit: 5,
            })

            expect(result).toHaveLength(5)
            expect(result.map(row => `${row.book}:${row.chapter}`)).toEqual([
                "john:1",
                "luke:1",
                "exodus:2",
                "exodus:1",
                "genesis:2",
            ])
        })

        it("returns an empty array when user has no typed verses", async () => {
            const result = await repository.getRecentTypingLocations({
                userId: testUserId,
                limit: 5,
            })

            expect(result).toEqual([])
        })

        it("only returns verses for the requested user", async () => {
            const otherUserId = crypto.randomUUID()
            await db.insert(users).values({
                id: otherUserId,
                email: `test-${otherUserId}@example.com`,
                name: "Other User",
            })
            try {
                await createTypedVerse({
                    book: "genesis",
                    chapter: 1,
                    verse: 1,
                    createdAt: new Date("2024-01-01T10:00:00Z"),
                })
                await createTypedVerse({
                    userId: otherUserId,
                    book: "john",
                    chapter: 1,
                    verse: 1,
                    createdAt: new Date("2024-01-01T20:00:00Z"),
                })

                const result = await repository.getRecentTypingLocations({
                    userId: testUserId,
                    limit: 5,
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.book).toBe("genesis")
            } finally {
                await db
                    .delete(typedVerses)
                    .where(eq(typedVerses.userId, otherUserId))
                await db
                    .delete(typingSessions)
                    .where(eq(typingSessions.userId, otherUserId))
                await db.delete(users).where(eq(users.id, otherUserId))
            }
        })
    })
})
