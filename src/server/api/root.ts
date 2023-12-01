import { createTRPCRouter } from '~/server/api/trpc'
import { passageRouter } from './routers/passage.router'
import { typingSessionRouter } from '~/server/api/routers/typing-session.router'
import { chapterHistoryRouter } from '~/server/api/routers/typing-history.router'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    passage: passageRouter,
    typingSession: typingSessionRouter,
    chapterHistory: chapterHistoryRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
