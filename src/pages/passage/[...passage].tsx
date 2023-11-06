import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import Page from '../index'
import { GetServerSidePropsContext } from 'next'

export async function getServerSideProps({
    params,
}: GetServerSidePropsContext<{ passage?: string | string[] }>) {
    const helpers = createServerSideHelpers<AppRouter>({
        router: appRouter,
        ctx: { session: null, db },
        transformer: superjson,
    })

    if (params?.passage == null) {
        await helpers.passage.passage.prefetch('psalm 23')

        return { props: { trpcState: helpers.dehydrate() } }
    }

    const passage =
        typeof params.passage === 'string'
            ? params.passage.split('_').join(' ')
            : params.passage.join().split('_').join(' ')

    await helpers.passage.passage.prefetch(passage)

    return { props: { trpcState: helpers.dehydrate() } }
}

export default Page
