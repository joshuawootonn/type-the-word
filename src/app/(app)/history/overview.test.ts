import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { Book } from "~/lib/types/book"
import { db } from "~/server/db"
import { typedVerses, typingSessions, users } from "~/server/db/schema"
import { TypingSessionRepository } from "~/server/repositories/typingSession.repository"
import { createUser } from "~/test-infra/test-utils"

import { aggregateBookData } from "./overview"

describe("History Overview", () => {
    it("janet 2_timothy", async () => {
        const user = await createUser()
        try {
            const typingSessionRepository = new TypingSessionRepository(db)

            const typingSessions = await typingSessionRepository.getMany({
                userId: user.id,
            })

            const overview = await aggregateBookData(typingSessions, "esv")

            const secondTimothy = overview[Book["2_timothy"]]
            const chapterOne = secondTimothy.chapters["1"]!
            const chapterTwo = secondTimothy.chapters["2"]!
            const chapterThree = secondTimothy.chapters["3"]!
            const chapterFour = secondTimothy.chapters["4"]!
            expect(chapterOne.typedVersesInCurrentPrestige).toBeLessThanOrEqual(
                0,
            )
            expect(chapterTwo.typedVersesInCurrentPrestige).toBeLessThanOrEqual(
                0,
            )
            expect(
                chapterThree.typedVersesInCurrentPrestige,
            ).toBeLessThanOrEqual(14)
            expect(
                chapterFour.typedVersesInCurrentPrestige,
            ).toBeLessThanOrEqual(0)
            expect(secondTimothy.typedVersesInCurrentPrestige).toBe(14)
            expect(secondTimothy.totalVerses).toBe(83)
        } finally {
            // Avoid cross-test interference by cleaning up only this test's user data.
            await db.delete(typedVerses).where(eq(typedVerses.userId, user.id))
            await db
                .delete(typingSessions)
                .where(eq(typingSessions.userId, user.id))
            await db.delete(users).where(eq(users.id, user.id))
        }
    }, 10000)
})
