import { signIn, signOut, useSession } from 'next-auth/react'
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

export const DEFAULT_PASSAGE_REFERENCE = 'psalm 23'

export async function getStaticProps() {
    const helpers = createServerSideHelpers<AppRouter>({
        router: appRouter,
        ctx: { session: null, db },
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
        <div className="container mx-auto flex min-h-screen max-w-page flex-col">
            <Head>
                <title>Type the Word</title>
                <meta
                    name="description"
                    content="A typing practice that track you typing through the Bible. Improve your typing skills while exploring biblical passages and verses. Enhance your accuracy and speed as you type through the sacred text."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <nav className="prose mx-auto mb-2 flex w-full items-center justify-between pt-8">
                <h1 className="m-0 font-mono text-xl font-extrabold tracking-tight text-black">
                    Type the Word
                </h1>
                <AuthShowcase />
            </nav>
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-8">
                <label htmlFor="passage" className="text-black">
                    Passage:
                </label>
                <div className={'svg-outline relative '}>
                    <input
                        type="text"
                        className="border-2 border-black p-1"
                        value={value}
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
                    <Arena autofocus={true} passage={passage.data} />
                )}
            </main>
            <footer className="prose mx-auto flex w-full items-start justify-start py-2">
                <a
                    className="svg-outline relative flex-grow text-xs no-underline"
                    href="https://www.esv.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    (ESV)
                </a>
            </footer>
        </div>
    )
}

function AuthShowcase() {
    const { data: sessionData } = useSession()

    return (
        <div className="flex flex-col  gap-4">
            <button
                className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black"
                onClick={
                    sessionData ? () => void signOut() : () => void signIn()
                }
            >
                {sessionData ? `Sign out ${sessionData.user?.name}` : 'Sign in'}
            </button>
        </div>
    )
}
