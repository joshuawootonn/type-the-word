import Head from 'next/head'

import { Arena } from '~/components/arena'
import { api } from '~/utils/api'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { AppRouter, appRouter } from '~/server/api/root'
import superjson from 'superjson'
import { db } from '~/server/db'
import { Navigation } from '~/components/navigation'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { Footer } from '~/components/footer'
import { Loading } from '~/components/loading'
import Link from 'next/link'
import { EmailLink } from '~/components/emailLink'

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

    await helpers.passage.passage.prefetch('john 8:31-32')
    await helpers.passage.passage.prefetch('deuteronomy 17:18-20')
    await helpers.passage.passage.prefetch('joshua 1:8')
    await helpers.passage.passage.prefetch('psalm 1:1-3')
    await helpers.passage.passage.prefetch('matthew 4:4')

    return { props: { trpcState: helpers.dehydrate() } }
}

export default function Home() {
    const one = api.passage.passage.useQuery('john 8:31-32')
    const two = api.passage.passage.useQuery('deuteronomy 17:18-20')
    const three = api.passage.passage.useQuery('joshua 1:8')
    const four = api.passage.passage.useQuery('psalm 1:1-3')
    const five = api.passage.passage.useQuery('matthew 4:4')

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word</title>
                <meta
                    name="description"
                    content="A typing practice that track you typing through the Bible. Improve your typing skills while exploring biblical passages and verses. Enhance your accuracy and speed as you type through the sacred text."
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og/why?"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />

            <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg  lg:pt-8">
                <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                    <h1>Why?</h1>
                    <hr className="mx-0 w-full border-t-2  border-black" />
                    <h2>Why did I make typetheword.site?</h2>
                    <p>
                        A couple of years ago, I typed out Psalms 1 to 137 over
                        a 6 month period. Not only did this improve my typing,
                        but it also encouraged me daily. When I later discovered{' '}
                        <a
                            href={'https://monkeytype.com'}
                            className="svg-outline relative"
                        >
                            monkey type
                        </a>
                        , it made sense to combine the two ideas. Typing the
                        Bible makes you look at every word and see the passage
                        anew. When I was developing this site, I used{' '}
                        <Link
                            href={'/passage/john_11:34-36'}
                            className="svg-outline relative"
                        >
                            John 11:35
                        </Link>{' '}
                        as the edgecase since its the shortest verse in the
                        Bible. Typing it over and over made me realize that
                        Jesus wept because he loved Lazarus. He died for us
                        because he loves us with the same love.
                        <br />
                        <br />
                        My hope is that by typing the word you will also see the
                        Bible in a deeper way.
                    </p>
                    <hr className="mx-0 w-full border-t-2  border-black" />
                    <h2>Why meditate on God&apos;s word?</h2>
                    <p>
                        In the process of making typetheword.site, these
                        scriptures were great reminders of why we should
                        meditate on God&apos;s word. If you have others, feel
                        free to <EmailLink>email me</EmailLink>. I would love to
                        make this page a long list of all the scripture pointing
                        to why we should meditate on God&apos;s word.
                    </p>
                </div>
                <div className={'prose-h2:text-2xl'}>
                    {one.isLoading ? (
                        <Loading />
                    ) : one.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Arena
                            passage={one.data}
                            key={JSON.stringify(one.data)}
                        />
                    )}
                    {two.isLoading ? (
                        <Loading />
                    ) : two.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Arena
                            autofocus={false}
                            autoSelect={false}
                            passage={two.data}
                            key={JSON.stringify(two.data)}
                        />
                    )}
                    {three.isLoading ? (
                        <Loading />
                    ) : three.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Arena
                            autofocus={false}
                            autoSelect={false}
                            passage={three.data}
                            key={JSON.stringify(three.data)}
                        />
                    )}
                    {four.isLoading ? (
                        <Loading />
                    ) : four.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Arena
                            autofocus={false}
                            autoSelect={false}
                            passage={four.data}
                            key={JSON.stringify(four.data)}
                        />
                    )}
                    {five.isLoading ? (
                        <Loading />
                    ) : five.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Arena
                            autofocus={false}
                            autoSelect={false}
                            passage={five.data}
                            key={JSON.stringify(five.data)}
                        />
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}
