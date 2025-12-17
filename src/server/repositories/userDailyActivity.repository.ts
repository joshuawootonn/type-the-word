import { eq, sql } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import toProperCase from '~/lib/toProperCase'
import * as schema from '~/server/db/schema'

export type DailyActivityRow = typeof schema.userDailyActivity.$inferSelect

/**
 * Stats for a single verse (from calculateStatsForVerse)
 */
export type VerseStats = {
    wpm: number
    accuracy: number
    correctedAccuracy: number
}

/**
 * Format a single verse reference for display
 * e.g., "Genesis 1:1" or "1 Corinthians 13:4"
 */
export function formatVerseReference(
    book: schema.Book,
    chapter: number,
    verse: number,
): string {
    const bookName = toProperCase(book.split('_').join(' '))
    return `${bookName} ${chapter}:${verse}`
}

export class UserDailyActivityRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    /**
     * Get all daily activity for a user, ordered by date descending
     */
    async getByUserId(userId: string): Promise<DailyActivityRow[]> {
        return this.db.query.userDailyActivity.findMany({
            where: eq(schema.userDailyActivity.userId, userId),
            orderBy: (activity, { desc }) => [desc(activity.date)],
        })
    }

    /**
     * Record activity for a single verse typed
     * Upserts the daily activity row, incrementing verseCount and appending to passages
     * Optionally updates running averages for WPM/accuracy if stats are provided
     */
    async recordActivity(
        userId: string,
        date: Date,
        book: schema.Book,
        chapter: number,
        verse: number,
        stats?: VerseStats | null,
    ): Promise<void> {
        // Normalize to start of day (UTC)
        const dayStart = new Date(date)
        dayStart.setUTCHours(0, 0, 0, 0)

        const passageString = formatVerseReference(book, chapter, verse)

        if (stats) {
            // Insert with stats - update running averages on conflict
            await this.db
                .insert(schema.userDailyActivity)
                .values({
                    userId,
                    date: dayStart,
                    verseCount: 1,
                    passages: [passageString],
                    averageWpm: stats.wpm,
                    averageAccuracy: stats.accuracy,
                    averageCorrectedAccuracy: stats.correctedAccuracy,
                    versesWithStats: 1,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userDailyActivity.userId,
                        schema.userDailyActivity.date,
                    ],
                    set: {
                        verseCount: sql`${schema.userDailyActivity.verseCount} + 1`,
                        passages: sql`
                            CASE 
                                WHEN ${schema.userDailyActivity.passages} @> ${JSON.stringify([passageString])}::jsonb 
                                THEN ${schema.userDailyActivity.passages}
                                ELSE ${schema.userDailyActivity.passages} || ${JSON.stringify([passageString])}::jsonb
                            END
                        `,
                        // Update running averages: newAvg = (oldAvg * oldCount + newValue) / (oldCount + 1)
                        averageWpm: sql`
                            ROUND(
                                (COALESCE(${schema.userDailyActivity.averageWpm}, 0) * ${schema.userDailyActivity.versesWithStats} + ${stats.wpm})::numeric 
                                / (${schema.userDailyActivity.versesWithStats} + 1)
                            )::integer
                        `,
                        averageAccuracy: sql`
                            ROUND(
                                (COALESCE(${schema.userDailyActivity.averageAccuracy}, 0) * ${schema.userDailyActivity.versesWithStats} + ${stats.accuracy})::numeric 
                                / (${schema.userDailyActivity.versesWithStats} + 1)
                            )::integer
                        `,
                        averageCorrectedAccuracy: sql`
                            ROUND(
                                (COALESCE(${schema.userDailyActivity.averageCorrectedAccuracy}, 0) * ${schema.userDailyActivity.versesWithStats} + ${stats.correctedAccuracy})::numeric 
                                / (${schema.userDailyActivity.versesWithStats} + 1)
                            )::integer
                        `,
                        versesWithStats: sql`${schema.userDailyActivity.versesWithStats} + 1`,
                        updatedAt: new Date(),
                    },
                })
        } else {
            // Insert without stats - just update verse count and passages
            await this.db
                .insert(schema.userDailyActivity)
                .values({
                    userId,
                    date: dayStart,
                    verseCount: 1,
                    passages: [passageString],
                    versesWithStats: 0,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userDailyActivity.userId,
                        schema.userDailyActivity.date,
                    ],
                    set: {
                        verseCount: sql`${schema.userDailyActivity.verseCount} + 1`,
                        passages: sql`
                            CASE 
                                WHEN ${schema.userDailyActivity.passages} @> ${JSON.stringify([passageString])}::jsonb 
                                THEN ${schema.userDailyActivity.passages}
                                ELSE ${schema.userDailyActivity.passages} || ${JSON.stringify([passageString])}::jsonb
                            END
                        `,
                        updatedAt: new Date(),
                    },
                })
        }
    }

    /**
     * Batch upsert for backfill - sets exact values
     */
    async batchUpsert(
        data: Array<{
            userId: string
            date: Date
            verseCount: number
            passages: string[]
            averageWpm?: number | null
            averageAccuracy?: number | null
            averageCorrectedAccuracy?: number | null
            versesWithStats?: number
        }>,
    ): Promise<void> {
        for (const row of data) {
            // Normalize to start of day (UTC)
            const dayStart = new Date(row.date)
            dayStart.setUTCHours(0, 0, 0, 0)

            await this.db
                .insert(schema.userDailyActivity)
                .values({
                    userId: row.userId,
                    date: dayStart,
                    verseCount: row.verseCount,
                    passages: row.passages,
                    averageWpm: row.averageWpm ?? null,
                    averageAccuracy: row.averageAccuracy ?? null,
                    averageCorrectedAccuracy:
                        row.averageCorrectedAccuracy ?? null,
                    versesWithStats: row.versesWithStats ?? 0,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userDailyActivity.userId,
                        schema.userDailyActivity.date,
                    ],
                    set: {
                        verseCount: row.verseCount,
                        passages: row.passages,
                        averageWpm: row.averageWpm ?? null,
                        averageAccuracy: row.averageAccuracy ?? null,
                        averageCorrectedAccuracy:
                            row.averageCorrectedAccuracy ?? null,
                        versesWithStats: row.versesWithStats ?? 0,
                        updatedAt: new Date(),
                    },
                })
        }
    }
}
