import Head from 'next/head'

import { useRouter } from 'next/router'
import { Navigation } from '~/components/navigation'
import { GetServerSidePropsContext } from 'next'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { appRouter, AppRouter } from '~/server/api/root'
import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import superjson from 'superjson'
import { api } from '~/utils/api'
import { format, formatDuration, intervalToDuration } from 'date-fns'

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

    await helpers.typingSession.getLog.prefetch()

    return { props: { trpcState: helpers.dehydrate() } }
}

export default function Home() {
    const { asPath } = useRouter()
    const finalSlashIndex = asPath.lastIndexOf('/')
    const previousPath = asPath.slice(0, finalSlashIndex)

    const log = api.typingSession.getLog.useQuery()

    return (
        <div className="container mx-auto flex min-h-screen max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - History</title>
                <meta
                    name="description"
                    content="History of all the passages you have typed."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <main className="prose mx-auto mb-8 w-full pt-4 lg:pt-8">
                <h1 className="">History</h1>
                <hr className="mx-0 w-full border-t-2 border-black" />
                <h2>Summary</h2>
                <p>coming soon....</p>
                <hr className="mx-0 w-full border-t-2 border-black" />
                <h2>Log</h2>
                {log.isLoading ? (
                    <>Loading... </>
                ) : log.error ? (
                    <>We hit a whoopsie! :(</>
                ) : (
                    log.data.map(a => {
                        return (
                            <p>
                                Typed {a.numberOfVersesTyped} verses in{' '}
                                {a.location} on{' '}
                                {format(a.createdAt, 'h:mm aaaa MM/dd/yyyy')} in{' '}
                                {formatDuration(
                                    intervalToDuration({
                                        start: a.createdAt,
                                        end: a.updatedAt,
                                    }),
                                )}
                            </p>
                        )
                    })
                )}
            </main>
        </div>
    )
}
