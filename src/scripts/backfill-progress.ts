/**
 * Backfill script to populate the userBookProgress and userChapterProgress
 * cache tables for existing users.
 *
 * This script:
 * 1. Fetches all users from the database
 * 2. For each user, computes their book progress using the existing aggregateBookData function
 * 3. Inserts the computed data into the cache tables
 *
 * Run with: dotenv pnpm dlx tsx ./src/scripts/backfill-progress.ts
 */
import { aggregateBookData } from "~/app/history/overview"
import { Book, bookSchema } from "~/lib/types/book"
import { getBibleMetadata } from "~/server/bibleMetadata"
import { db } from "~/server/db"
import { users, Translation } from "~/server/db/schema"
import { TypingSessionRepository } from "~/server/repositories/typingSession.repository"
import { UserProgressRepository } from "~/server/repositories/userProgress.repository"

async function backfillUserProgress() {
    console.log("Starting backfill of book/chapter progress tables...")

    const bibleMetadata = getBibleMetadata()

    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users)
    console.log(`Found ${allUsers.length} users to process`)

    const typingSessionRepository = new TypingSessionRepository(db)
    const userProgressRepository = new UserProgressRepository(db)

    let processedCount = 0
    let errorCount = 0

    for (const user of allUsers) {
        try {
            // Fetch typing sessions for this user
            const typingSessions = await typingSessionRepository.getMany({
                userId: user.id,
            })

            if (typingSessions.length === 0) {
                processedCount++
                continue
            }

            // Compute book progress using existing aggregation logic
            const bookData = aggregateBookData(typingSessions)

            // Convert aggregated data to rows for the cache tables
            const bookRows: Array<{
                userId: string
                book: Book
                translation: Translation
                prestige: number
                typedVerseCount: number
                totalVerses: number
            }> = []

            const chapterRows: Array<{
                userId: string
                book: Book
                chapter: number
                translation: Translation
                typedVerses: Record<number, boolean>
                totalVerses: number
            }> = []

            for (const bookSlug of bookSchema.options) {
                const book = bookData[bookSlug]
                if (!book) continue

                // Only include books with progress or prestige
                const hasProgress =
                    book.typedVersesInCurrentPrestige > 0 || book.prestige > 0
                if (!hasProgress) continue

                const bookMeta = bibleMetadata[bookSlug]
                if (!bookMeta) continue

                // Add book-level row with totals
                bookRows.push({
                    userId: user.id,
                    book: bookSlug,
                    translation: "esv", // Default to ESV for backfill
                    prestige: book.prestige,
                    typedVerseCount: book.typedVersesInCurrentPrestige,
                    totalVerses: book.totalVerses,
                })

                // Add chapter-level rows
                for (const [chapterStr, chapterData] of Object.entries(
                    book.chapters,
                )) {
                    const chapter = parseInt(chapterStr, 10)

                    // Only include chapters with progress
                    if (Object.keys(chapterData.verses).length === 0) continue

                    chapterRows.push({
                        userId: user.id,
                        book: bookSlug,
                        chapter,
                        translation: "esv",
                        typedVerses: chapterData.verses,
                        totalVerses: chapterData.totalVerses,
                    })
                }
            }

            // Batch upsert the rows
            if (bookRows.length > 0 || chapterRows.length > 0) {
                await userProgressRepository.batchUpsert({
                    books: bookRows,
                    chapters: chapterRows,
                })
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
backfillUserProgress()
    .then(() => {
        console.log("Backfill finished successfully")
        process.exit(0)
    })
    .catch(error => {
        console.error("Backfill failed:", error)
        process.exit(1)
    })
