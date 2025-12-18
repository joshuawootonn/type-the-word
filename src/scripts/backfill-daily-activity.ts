/**
 * Backfill script to populate the userDailyActivity cache table for existing users.
 *
 * This script:
 * 1. Fetches all users from the database
 * 2. For each user, fetches their typing sessions (optionally filtered by date range)
 * 3. Aggregates activity by day using the same logic as getLog2
 * 4. Calculates WPM/accuracy stats when typing data is available
 * 5. Inserts the computed data into the userDailyActivity table
 *
 * Run with:
 *   dotenv pnpm dlx tsx ./src/scripts/backfill-daily-activity.ts
 *   dotenv pnpm dlx tsx ./src/scripts/backfill-daily-activity.ts --start 2024-01-01 --end 2024-12-31
 */
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'

import { typingSessionToString } from '~/app/history/typingSessionToString'
import { calculateStatsForVerse, VerseStats } from '~/app/history/wpm'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import {
    TypedVerse,
    TypingSessionRepository,
} from '~/server/repositories/typingSession.repository'
import { UserDailyActivityRepository } from '~/server/repositories/userDailyActivity.repository'

type DayData = {
    verseCount: number
    typedVerses: TypedVerse[]
    stats: VerseStats[] // Stats for verses that have typing data
}

function parseArgs(): { startDate?: Date; endDate?: Date } {
    const args = process.argv.slice(2)
    let startDate: Date | undefined
    let endDate: Date | undefined

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--start' && args[i + 1]) {
            startDate = startOfDay(parseISO(args[i + 1]!))
            i++
        } else if (args[i] === '--end' && args[i + 1]) {
            endDate = endOfDay(parseISO(args[i + 1]!))
            i++
        }
    }

    return { startDate, endDate }
}

async function backfillDailyActivity() {
    const { startDate, endDate } = parseArgs()

    console.log('Starting backfill of daily activity table...')
    if (startDate) {
        console.log(`  Start date: ${format(startDate, 'yyyy-MM-dd')}`)
    }
    if (endDate) {
        console.log(`  End date: ${format(endDate, 'yyyy-MM-dd')}`)
    }

    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users)
    console.log(`Found ${allUsers.length} users to process`)

    const typingSessionRepository = new TypingSessionRepository(db)
    const dailyActivityRepository = new UserDailyActivityRepository(db)

    let processedCount = 0
    let errorCount = 0

    for (const user of allUsers) {
        try {
            // Fetch typing sessions for this user (filtered by date range if specified)
            const typingSessions = await typingSessionRepository.getMany({
                userId: user.id,
                startDate,
                endDate,
            })

            if (typingSessions.length === 0) {
                processedCount++
                continue
            }

            // Aggregate by day (using UTC dates to match storage)
            const dayMap = new Map<string, DayData>()

            for (const typingSession of typingSessions) {
                if (typingSession.typedVerses.length === 0) continue

                // Use createdAt date, normalized to UTC day
                const dayKey = format(typingSession.createdAt, 'yyyy-MM-dd')
                const existingDay = dayMap.get(dayKey)

                // Calculate stats for each verse that has typing data
                const verseStats: VerseStats[] = []
                for (const typedVerse of typingSession.typedVerses) {
                    const stats = calculateStatsForVerse(typedVerse)
                    if (stats) {
                        verseStats.push(stats)
                    }
                }

                if (existingDay) {
                    existingDay.verseCount += typingSession.typedVerses.length
                    existingDay.typedVerses.push(...typingSession.typedVerses)
                    existingDay.stats.push(...verseStats)
                } else {
                    dayMap.set(dayKey, {
                        verseCount: typingSession.typedVerses.length,
                        typedVerses: [...typingSession.typedVerses],
                        stats: verseStats,
                    })
                }
            }

            // Convert to rows for batch upsert
            const rows: Array<{
                userId: string
                date: Date
                verseCount: number
                passages: string[]
                averageWpm: number | null
                averageAccuracy: number | null
                averageCorrectedAccuracy: number | null
                versesWithStats: number
            }> = []

            for (const [dayKey, dayData] of dayMap.entries()) {
                // Format passages using same logic as getLog2
                const passagesString = typingSessionToString(
                    dayData.typedVerses,
                    { seperator: '\n' },
                )
                const passages = passagesString
                    .split('\n')
                    .map(p => p.trim())
                    .filter(p => p.length > 0)

                // Calculate average stats if we have any
                let averageWpm: number | null = null
                let averageAccuracy: number | null = null
                let averageCorrectedAccuracy: number | null = null

                if (dayData.stats.length > 0) {
                    const totalWpm = dayData.stats.reduce(
                        (sum, s) => sum + s.wpm,
                        0,
                    )
                    const totalAccuracy = dayData.stats.reduce(
                        (sum, s) => sum + s.accuracy,
                        0,
                    )
                    const totalCorrectedAccuracy = dayData.stats.reduce(
                        (sum, s) => sum + s.correctedAccuracy,
                        0,
                    )

                    averageWpm = Math.round(totalWpm / dayData.stats.length)
                    averageAccuracy = Math.round(
                        totalAccuracy / dayData.stats.length,
                    )
                    averageCorrectedAccuracy = Math.round(
                        totalCorrectedAccuracy / dayData.stats.length,
                    )
                }

                rows.push({
                    userId: user.id,
                    date: new Date(dayKey),
                    verseCount: dayData.verseCount,
                    passages,
                    averageWpm,
                    averageAccuracy,
                    averageCorrectedAccuracy,
                    versesWithStats: dayData.stats.length,
                })
            }

            // Batch upsert
            if (rows.length > 0) {
                await dailyActivityRepository.batchUpsert(rows)
            }

            processedCount++
            if (processedCount % 100 === 0) {
                console.log(
                    `Processed ${processedCount}/${allUsers.length} users...`,
                )
            }
        } catch (error) {
            errorCount++
            console.error(`Error processing user ${user.id}:`, error)
        }
    }

    console.log(
        `\nBackfill complete! Processed ${processedCount} users with ${errorCount} errors.`,
    )
}

// Run the backfill
backfillDailyActivity()
    .then(() => {
        console.log('Backfill finished successfully')
        process.exit(0)
    })
    .catch(error => {
        console.error('Backfill failed:', error)
        process.exit(1)
    })
