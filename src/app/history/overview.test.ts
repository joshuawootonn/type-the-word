import { describe, it } from "vitest"
import { db } from "~/server/db"
import { TypingSessionRepository } from "~/server/repositories/typingSession.repository"
import { createUser, truncateTables } from "~/test-infra/test-utils"
import { aggregateBookData } from "./overview"

describe('History Overview', () => {
    it('should render', async () => {
        await truncateTables()
        const user = await createUser()
        console.log('user created',user)
        const typingSessionRepository = new TypingSessionRepository(db)

        console.log('getting typing sessions')
        const typingSessions = await typingSessionRepository.getMany({
            userId: user.id,
        })
        console.log('typing sessions got',typingSessions.length)
    
        // const overview = aggregateBookData(typingSessions)

        // console.log(overview["2_timothy"])

    },10000)
})

