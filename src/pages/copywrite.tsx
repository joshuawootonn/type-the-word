import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { appRouter, AppRouter } from '~/server/api/root'
import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import superjson from 'superjson'

export async function getServerSideProps() {
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
    return (
        <div className="container mx-auto flex min-h-screen max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - Copywrite</title>
                <meta
                    name="description"
                    content="Copywrite for Type the Word."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <main className="prose mx-auto mb-8 w-full pt-4 lg:pt-8">
                <h1 className="">Copywrite</h1>
                <p>
                    Scripture quotations are from the ESV® Bible (The Holy
                    Bible, English Standard Version®), © 2001 by Crossway, a
                    publishing ministry of Good News Publishers. Used by
                    permission. All rights reserved. The ESV text may not be
                    quoted in any publication made available to the public by a
                    Creative Commons license. The ESV may not be translated into
                    any other language.
                    <br />
                    <br />
                    Users may not copy or download more than 500 verses of the
                    ESV Bible or more than one half of any book of the ESV
                    Bible.
                </p>
            </main>
        </div>
    )
}
