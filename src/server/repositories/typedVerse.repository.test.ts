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
    }) {
        const sessionId = crypto.randomUUID()
        await db.insert(typingSessions).values({
            id: sessionId,
            userId: testUserId,
            createdAt: opts.createdAt ?? new Date(),
            updatedAt: opts.createdAt ?? new Date(),
        })

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
})
