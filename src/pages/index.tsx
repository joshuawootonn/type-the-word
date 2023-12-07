import Head from 'next/head'
import { useState } from 'react'

import { Arena } from '~/components/arena'
import { api } from '~/utils/api'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import { useRouter } from 'next/router'
import { useDebouncedValue } from '~/lib/hooks'
import { Navigation } from '~/components/navigation'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { Footer } from '~/components/footer'
import { Loading } from '~/components/loading'
import { PassageSelector } from '~/components/passageSelector'

export const DEFAULT_PASSAGE_REFERENCE = 'psalm 23'

export async function getStaticProps() {
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

    await helpers.passage.passage.prefetch(DEFAULT_PASSAGE_REFERENCE)

    return { props: { trpcState: helpers.dehydrate() } }
}

export default function Home(props: { passage?: string }) {
    const [value, setValue] = useState(
        props.passage ?? DEFAULT_PASSAGE_REFERENCE,
    )
    const debouncedValue = useDebouncedValue(value, 1000)
    const passage = api.passage.passage.useQuery(debouncedValue)

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word</title>
                <meta
                    name="description"
                    content="Practice your typing while meditating on the Bible. Type the word is an easy to "
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-4 lg:pt-8">
                <PassageSelector value={value} setValue={setValue} />
            </div>

            <main className="relative mx-auto w-full flex-grow">
                {passage.isLoading ? (
                    <Loading />
                ) : passage.error ? (
                    <>We hit a whoopsie! :(</>
                ) : (
                    <Arena
                        autofocus={true}
                        passage={passage.data}
                        key={JSON.stringify(passage.data)}
                    />
                )}
            </main>
            <Footer />
        </div>
    )
}
