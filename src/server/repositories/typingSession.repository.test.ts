import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from '~/server/db'
import { typedVerses, typingSessions, users } from '~/server/db/schema'

import { TypingSessionRepository } from './typingSession.repository'

describe('TypingSessionRepository - Integration Tests', () => {
    const repository = new TypingSessionRepository(db)
    let testUserId: string

    beforeEach(async () => {
        // Create a test user
        testUserId = crypto.randomUUID()
        await db.insert(users).values({
            id: testUserId,
            email: `test-${testUserId}@example.com`,
            name: 'Test User',
        })
    })

    afterEach(async () => {
        // Clean up test data in correct order (foreign key constraints)
        await db.delete(typedVerses).where(eq(typedVerses.userId, testUserId))
        await db
            .delete(typingSessions)
            .where(eq(typingSessions.userId, testUserId))
        await db.delete(users).where(eq(users.id, testUserId))
    })

    // Helper to create a typing session with typed verses
    async function createTypingSession(
        userId: string,
        createdAt: Date,
        verses: Array<{
            book: 'genesis' | 'exodus' | 'luke' | 'john'
            chapter: number
            verse: number
        }>,
    ) {
        const sessionId = crypto.randomUUID()
        await db.insert(typingSessions).values({
            id: sessionId,
            userId,
            createdAt,
            updatedAt: createdAt,
        })

        for (const verse of verses) {
            await db.insert(typedVerses).values({
                id: crypto.randomUUID(),
                userId,
                typingSessionId: sessionId,
                translation: 'esv',
                book: verse.book,
                chapter: verse.chapter,
                verse: verse.verse,
                createdAt,
            })
        }

        return sessionId
    }

    describe('getOneOrNull', () => {
        it('returns null when no session exists for user', async () => {
            const result = await repository.getOneOrNull({ userId: testUserId })

            expect(result).toBeNull()
        })

        it('returns the most recent session for user', async () => {
            const olderDate = new Date('2024-01-01T10:00:00Z')
            const newerDate = new Date('2024-01-02T10:00:00Z')

            await createTypingSession(testUserId, olderDate, [
                { book: 'genesis', chapter: 1, verse: 1 },
            ])
            const newerId = await createTypingSession(testUserId, newerDate, [
                { book: 'exodus', chapter: 1, verse: 1 },
            ])

            const result = await repository.getOneOrNull({ userId: testUserId })

            expect(result).not.toBeNull()
            expect(result!.id).toBe(newerId)
            expect(result!.typedVerses).toHaveLength(1)
            expect(result!.typedVerses[0]!.book).toBe('exodus')
        })

        it('returns session by id', async () => {
            const sessionId = await createTypingSession(
                testUserId,
                new Date('2024-01-01'),
                [{ book: 'genesis', chapter: 1, verse: 1 }],
            )

            const result = await repository.getOneOrNull({ id: sessionId })

            expect(result).not.toBeNull()
            expect(result!.id).toBe(sessionId)
        })

        it('returns null for non-existent id', async () => {
            const result = await repository.getOneOrNull({
                id: crypto.randomUUID(),
            })

            expect(result).toBeNull()
        })

        it('throws error when neither userId nor id provided', async () => {
            await expect(repository.getOneOrNull({})).rejects.toThrow(
                'Must provide either userId or id',
            )
        })

        it('includes typed verses in result', async () => {
            await createTypingSession(testUserId, new Date('2024-01-01'), [
                { book: 'genesis', chapter: 1, verse: 1 },
                { book: 'genesis', chapter: 1, verse: 2 },
                { book: 'genesis', chapter: 1, verse: 3 },
            ])

            const result = await repository.getOneOrNull({ userId: testUserId })

            expect(result).not.toBeNull()
            expect(result!.typedVerses).toHaveLength(3)
        })
    })

    describe('getOne', () => {
        it('returns session when it exists', async () => {
            const sessionId = await createTypingSession(
                testUserId,
                new Date('2024-01-01'),
                [{ book: 'genesis', chapter: 1, verse: 1 }],
            )

            const result = await repository.getOne({ id: sessionId })

            expect(result.id).toBe(sessionId)
        })

        it('throws error when session not found', async () => {
            await expect(
                repository.getOne({ id: crypto.randomUUID() }),
            ).rejects.toThrow('Typing session not found')
        })

        it('throws error when user has no sessions', async () => {
            await expect(
                repository.getOne({ userId: testUserId }),
            ).rejects.toThrow('Typing session not found')
        })
    })

    describe('getMany', () => {
        it('returns empty array when user has no sessions', async () => {
            const result = await repository.getMany({ userId: testUserId })

            expect(result).toEqual([])
        })

        it('returns all sessions for user', async () => {
            await createTypingSession(testUserId, new Date('2024-01-01'), [
                { book: 'genesis', chapter: 1, verse: 1 },
            ])
            await createTypingSession(testUserId, new Date('2024-01-02'), [
                { book: 'exodus', chapter: 1, verse: 1 },
            ])
            await createTypingSession(testUserId, new Date('2024-01-03'), [
                { book: 'luke', chapter: 1, verse: 1 },
            ])

            const result = await repository.getMany({ userId: testUserId })

            expect(result).toHaveLength(3)
        })

        it('returns sessions ordered by createdAt descending', async () => {
            await createTypingSession(testUserId, new Date('2024-01-01'), [
                { book: 'genesis', chapter: 1, verse: 1 },
            ])
            await createTypingSession(testUserId, new Date('2024-01-03'), [
                { book: 'luke', chapter: 1, verse: 1 },
            ])
            await createTypingSession(testUserId, new Date('2024-01-02'), [
                { book: 'exodus', chapter: 1, verse: 1 },
            ])

            const result = await repository.getMany({ userId: testUserId })

            expect(result).toHaveLength(3)
            // Most recent first
            expect(result[0]!.typedVerses[0]!.book).toBe('luke')
            expect(result[1]!.typedVerses[0]!.book).toBe('exodus')
            expect(result[2]!.typedVerses[0]!.book).toBe('genesis')
        })

        describe('date filtering', () => {
            it('filters by startDate', async () => {
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-01T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-15T10:00:00Z'),
                    [{ book: 'exodus', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-20T10:00:00Z'),
                    [{ book: 'luke', chapter: 1, verse: 1 }],
                )

                const result = await repository.getMany({
                    userId: testUserId,
                    startDate: new Date('2024-01-10T00:00:00Z'),
                })

                expect(result).toHaveLength(2)
                expect(
                    result.some(s => s.typedVerses[0]!.book === 'genesis'),
                ).toBe(false)
            })

            it('filters by endDate', async () => {
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-01T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-15T10:00:00Z'),
                    [{ book: 'exodus', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-20T10:00:00Z'),
                    [{ book: 'luke', chapter: 1, verse: 1 }],
                )

                const result = await repository.getMany({
                    userId: testUserId,
                    endDate: new Date('2024-01-16T00:00:00Z'),
                })

                expect(result).toHaveLength(2)
                expect(
                    result.some(s => s.typedVerses[0]!.book === 'luke'),
                ).toBe(false)
            })

            it('filters by both startDate and endDate', async () => {
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-01T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-15T10:00:00Z'),
                    [{ book: 'exodus', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-20T10:00:00Z'),
                    [{ book: 'luke', chapter: 1, verse: 1 }],
                )

                const result = await repository.getMany({
                    userId: testUserId,
                    startDate: new Date('2024-01-10T00:00:00Z'),
                    endDate: new Date('2024-01-16T00:00:00Z'),
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typedVerses[0]!.book).toBe('exodus')
            })

            it('returns empty when no sessions in date range', async () => {
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-01T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 1 }],
                )

                const result = await repository.getMany({
                    userId: testUserId,
                    startDate: new Date('2024-06-01T00:00:00Z'),
                    endDate: new Date('2024-06-30T00:00:00Z'),
                })

                expect(result).toHaveLength(0)
            })
        })

        describe('book filtering', () => {
            it('filters sessions by book', async () => {
                await createTypingSession(testUserId, new Date('2024-01-01'), [
                    { book: 'genesis', chapter: 1, verse: 1 },
                ])
                await createTypingSession(testUserId, new Date('2024-01-02'), [
                    { book: 'exodus', chapter: 1, verse: 1 },
                ])
                await createTypingSession(testUserId, new Date('2024-01-03'), [
                    { book: 'genesis', chapter: 2, verse: 1 },
                ])

                const result = await repository.getMany({
                    userId: testUserId,
                    book: 'genesis',
                })

                expect(result).toHaveLength(2)
                expect(
                    result.every(s => s.typedVerses[0]!.book === 'genesis'),
                ).toBe(true)
            })

            it('includes session if any verse matches book', async () => {
                await createTypingSession(testUserId, new Date('2024-01-01'), [
                    { book: 'genesis', chapter: 1, verse: 1 },
                    { book: 'exodus', chapter: 1, verse: 1 },
                ])

                const result = await repository.getMany({
                    userId: testUserId,
                    book: 'exodus',
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typedVerses).toHaveLength(2)
            })
        })

        describe('chapter filtering', () => {
            it('filters sessions by chapter', async () => {
                await createTypingSession(testUserId, new Date('2024-01-01'), [
                    { book: 'genesis', chapter: 1, verse: 1 },
                ])
                await createTypingSession(testUserId, new Date('2024-01-02'), [
                    { book: 'genesis', chapter: 2, verse: 1 },
                ])
                await createTypingSession(testUserId, new Date('2024-01-03'), [
                    { book: 'exodus', chapter: 1, verse: 1 },
                ])

                const result = await repository.getMany({
                    userId: testUserId,
                    chapter: 1,
                })

                // Sessions with chapter 1 (genesis ch1 and exodus ch1)
                expect(result).toHaveLength(2)
            })
        })

        describe('combined filtering', () => {
            it('filters by book and chapter', async () => {
                await createTypingSession(testUserId, new Date('2024-01-01'), [
                    { book: 'genesis', chapter: 1, verse: 1 },
                ])
                await createTypingSession(testUserId, new Date('2024-01-02'), [
                    { book: 'genesis', chapter: 2, verse: 1 },
                ])
                await createTypingSession(testUserId, new Date('2024-01-03'), [
                    { book: 'exodus', chapter: 1, verse: 1 },
                ])

                const result = await repository.getMany({
                    userId: testUserId,
                    book: 'genesis',
                    chapter: 1,
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typedVerses[0]!.book).toBe('genesis')
                expect(result[0]!.typedVerses[0]!.chapter).toBe(1)
            })

            it('filters by date range, book, and chapter', async () => {
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-01T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-15T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 2 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-15T11:00:00Z'),
                    [{ book: 'genesis', chapter: 2, verse: 1 }],
                )
                await createTypingSession(
                    testUserId,
                    new Date('2024-01-20T10:00:00Z'),
                    [{ book: 'genesis', chapter: 1, verse: 3 }],
                )

                const result = await repository.getMany({
                    userId: testUserId,
                    book: 'genesis',
                    chapter: 1,
                    startDate: new Date('2024-01-10T00:00:00Z'),
                    endDate: new Date('2024-01-16T00:00:00Z'),
                })

                expect(result).toHaveLength(1)
                expect(result[0]!.typedVerses[0]!.verse).toBe(2)
            })
        })
    })
})
