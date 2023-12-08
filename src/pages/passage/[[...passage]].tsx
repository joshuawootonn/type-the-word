import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import Page, { DEFAULT_PASSAGE_REFERENCE } from '../index'
import { GetServerSidePropsContext } from 'next'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { decodeUrl } from '~/lib/url'

export async function getServerSideProps({
    params,
}: GetServerSidePropsContext<{ passage?: string | string[] }>) {
    const helpers = createServerSideHelpers<AppRouter>({
        router: appRouter,
        ctx: {
            session: null,
            db,
            repositories: {
                typingSession: new TypingSessionRepository(db),
            },
        },
        transformer: superjson,
    })

    if (params?.passage == null) {
        await helpers.passage.passage.prefetch(DEFAULT_PASSAGE_REFERENCE)

        return { props: { trpcState: helpers.dehydrate() } }
    }

    const passage =
        typeof params.passage === 'string'
            ? decodeUrl(params.passage)
            : decodeUrl(params.passage.at(0) ?? DEFAULT_PASSAGE_REFERENCE)

    await helpers.passage.passage.prefetch(passage)

    return { props: { trpcState: helpers.dehydrate(), passage } }
}

export default Page
