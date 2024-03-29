import Head from 'next/head'

import { Passage } from '~/components/passage'
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

    await helpers.passage.passage.prefetch({ reference: 'john 8:31-32' })
    await helpers.passage.passage.prefetch({
        reference: 'deuteronomy 17:18-20',
    })
    await helpers.passage.passage.prefetch({ reference: 'joshua 1:8' })
    await helpers.passage.passage.prefetch({ reference: 'psalm 1:1-3' })
    await helpers.passage.passage.prefetch({ reference: 'matthew 4:4' })
    await helpers.passage.passage.prefetch({ reference: 'psalm 119:9-11' })
    await helpers.passage.passage.prefetch({ reference: 'psalm 19:7-11' })

    return { props: { trpcState: helpers.dehydrate() } }
}

export default function Home() {
    const one = api.passage.passage.useQuery({ reference: 'john 8:31-32' })
    const two = api.passage.passage.useQuery({
        reference: 'deuteronomy 17:18-20',
    })
    const three = api.passage.passage.useQuery({ reference: 'joshua 1:8' })
    const four = api.passage.passage.useQuery({ reference: 'psalm 1:1-3' })
    const five = api.passage.passage.useQuery({ reference: 'matthew 4:4' })
    const six = api.passage.passage.useQuery({ reference: 'psalm 119:9-11' })
    const seven = api.passage.passage.useQuery({ reference: 'psalm 19:7-11' })

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Why I created Type the Word</title>
                <meta
                    name="description"
                    content="Why did I create Type the Word? Why should we meditate on the Bible?"
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og?path=why"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />

            <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert lg:pt-8">
                <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                    <h1>Why?</h1>
                    <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />
                    <h2>Why did I make typetheword.site?</h2>
                    <p>
                        A couple of years ago, I typed out Psalms 1 to 137 over
                        a 6 month period. Not only did this improve my typing,
                        but it also encouraged me daily. When I later discovered{' '}
                        <a
                            href={'https://monkeytype.com'}
                            className="svg-outline-sm relative"
                        >
                            monkeytype
                        </a>
                        , it made sense to combine the two ideas. Typing the
                        Bible makes you look at every word and see the passage
                        anew. When I was developing this site, I used{' '}
                        <Link
                            href={'/passage/john_11:34-36'}
                            className="svg-outline-sm relative dark:text-white"
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
                    <hr className="mx-0 w-full border-t-2  border-black dark:border-white" />
                    <h2>Why meditate on God&apos;s word?</h2>
                    <p>
                        In the process of making typetheword.site, these
                        scriptures were great reminders of why we should
                        meditate on God&apos;s word. If you have others, feel
                        free to{' '}
                        <EmailLink className="svg-outline-sm underline">
                            email me
                        </EmailLink>
                        . I would love to make this page a long list of all the
                        scripture pointing to why we should meditate on
                        God&apos;s word.
                    </p>
                </div>
                <div className={'prose-h2:text-2xl'}>
                    {one.isLoading ? (
                        <Loading />
                    ) : one.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Passage
                            autofocus={false}
                            autoSelect={false}
                            passage={one.data}
                            key={JSON.stringify(one.data)}
                        />
                    )}
                    {two.isLoading ? (
                        <Loading />
                    ) : two.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Passage
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
                        <Passage
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
                        <Passage
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
                        <Passage
                            autofocus={false}
                            autoSelect={false}
                            passage={five.data}
                            key={JSON.stringify(five.data)}
                        />
                    )}
                    {six.isLoading ? (
                        <Loading />
                    ) : six.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Passage
                            autofocus={false}
                            autoSelect={false}
                            passage={six.data}
                            key={JSON.stringify(six.data)}
                        />
                    )}
                    {seven.isLoading ? (
                        <Loading />
                    ) : seven.error ? (
                        <>We hit a whoopsie! :(</>
                    ) : (
                        <Passage
                            autofocus={false}
                            autoSelect={false}
                            passage={seven.data}
                            key={JSON.stringify(seven.data)}
                        />
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}
