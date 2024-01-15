import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import Page, { DEFAULT_PASSAGE_REFERENCE } from '../index'
import { GetServerSidePropsContext } from 'next'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { passageReferenceSchema } from '~/lib/passageReference'

export function getStaticPaths() {
    return { paths: [], fallback: 'blocking' }
}
export async function getStaticProps({
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
        await helpers.passage.passage.prefetch({
            reference: DEFAULT_PASSAGE_REFERENCE,
        })

        return { props: { trpcState: helpers.dehydrate() } }
    }

    const passage =
        typeof params.passage === 'string'
            ? passageReferenceSchema.parse(params.passage)
            : passageReferenceSchema.parse(
                  params.passage.at(0) ?? DEFAULT_PASSAGE_REFERENCE,
              )

    await helpers.passage.passage.prefetch({
        reference: passage,
    })

    return {
        props: { trpcState: helpers.dehydrate(), passage },
        revalidate: 60 * 60 * 24,
    }
}

export default Page
