import { describe, expect, it } from "vitest"

import { Book } from "~/lib/types/book"
import { db } from "~/server/db"
import { TypingSessionRepository } from "~/server/repositories/typingSession.repository"
import { createUser, truncateTables } from "~/test-infra/test-utils"

import { aggregateBookData } from "./overview"

describe("History Overview", () => {
    it("janet 2_timothy", async () => {
        await truncateTables()
        const user = await createUser()
        const typingSessionRepository = new TypingSessionRepository(db)

        const typingSessions = await typingSessionRepository.getMany({
            userId: user.id,
        })

        const overview = aggregateBookData(typingSessions)

        const secondTimothy = overview[Book["2_timothy"]]
        const chapterOne = secondTimothy.chapters["1"]!
        const chapterTwo = secondTimothy.chapters["2"]!
        const chapterThree = secondTimothy.chapters["3"]!
        const chapterFour = secondTimothy.chapters["4"]!
        expect(chapterOne.typedVersesInCurrentPrestige).toBeLessThanOrEqual(0)
        expect(chapterTwo.typedVersesInCurrentPrestige).toBeLessThanOrEqual(0)
        expect(chapterThree.typedVersesInCurrentPrestige).toBeLessThanOrEqual(
            14,
        )
        expect(chapterFour.typedVersesInCurrentPrestige).toBeLessThanOrEqual(0)
        expect(secondTimothy.typedVersesInCurrentPrestige).toBe(14)
        expect(secondTimothy.totalVerses).toBe(83)
    }, 10000)
})
