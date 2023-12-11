import Head from 'next/head'
import { useState } from 'react'

import { Arena } from '~/components/arena'
import { api } from '~/utils/api'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import { useDebouncedValue } from '~/lib/hooks'
import { Navigation } from '~/components/navigation'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { Footer } from '~/components/footer'
import { Loading } from '~/components/loading'
import { PassageSelector } from '~/components/passageSelector'
import {
    PassageReference,
    passageReferenceSchema,
} from '~/lib/passageReference'
import { useRouter } from 'next/router'

export const DEFAULT_PASSAGE_REFERENCE = 'psalm_23'

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

    await helpers.passage.passage.prefetch(
        passageReferenceSchema.parse(DEFAULT_PASSAGE_REFERENCE),
    )

    return { props: { trpcState: helpers.dehydrate() } }
}

export default function Home(props: { passage?: PassageReference }) {
    const [value, setValue] = useState<PassageReference>(
        props.passage ??
            passageReferenceSchema.parse(DEFAULT_PASSAGE_REFERENCE),
    )
    const debouncedValue = useDebouncedValue(value, 0)
    const passage = api.passage.passage.useQuery(debouncedValue)
    const router = useRouter()

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word</title>
                <meta
                    name="description"
                    content="Practice your typing while meditating on the Bible. Type the word is an easy to "
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-4 lg:pt-8">
                <PassageSelector value={value} setValue={setValue} />
            </div>

            <main className="relative mx-auto w-full flex-grow">
                {router.isFallback || passage.isLoading ? (
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
