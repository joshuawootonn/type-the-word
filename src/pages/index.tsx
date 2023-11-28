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
import Link from 'next/link'

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
    const { push } = useRouter()
    const [value, setValue] = useState(
        props.passage ?? DEFAULT_PASSAGE_REFERENCE,
    )
    const debouncedValue = useDebouncedValue(value, 1000)
    const passage = api.passage.passage.useQuery(debouncedValue)

    return (
        <div className="container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word</title>
                <meta
                    name="description"
                    content="A typing practice that track you typing through the Bible. Improve your typing skills while exploring biblical passages and verses. Enhance your accuracy and speed as you type through the sacred text."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-4 lg:pt-8">
                <label htmlFor="passage" className="text-black">
                    Passage:
                </label>
                <div className={'svg-outline relative'}>
                    <input
                        type="text"
                        className="border-2 border-black p-1"
                        value={value}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                            const passage = e.target.value
                                .trim()
                                .split(' ')
                                .join('_')
                            void push(`/passage/${passage}`)
                            setValue(e.target.value)
                        }}
                    />
                </div>
            </div>

            <main className="relative mx-auto w-full flex-grow">
                {passage.isLoading ? (
                    <>Loading... </>
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
            <footer className="prose mx-auto flex w-full items-start justify-start space-x-3 py-2">
                <a
                    className="svg-outline relative text-xs no-underline"
                    href="https://www.esv.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    (ESV)
                </a>
                <Link
                    className="svg-outline relative  text-xs no-underline"
                    href={'/copywrite'}
                >
                    copywrite
                </Link>
            </footer>
        </div>
    )
}
