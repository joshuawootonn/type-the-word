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
import { PassageSelector } from '~/components/passageSelector'
import {
    PassageReference,
    passageReferenceSchema,
} from '~/lib/passageReference'
import { useRouter } from 'next/router'
import { passageUrlSchema } from '~/lib/passageUrl'

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

    // todo: ideally I wouldn't be saving these to the database, but the `savePassageResponseToDatabase` option has to match the input of the client or there is no server optimization
    await helpers.passage.passage.prefetch({
        reference: passageReferenceSchema.parse(DEFAULT_PASSAGE_REFERENCE),
        savePassageResponseToDatabase: true,
    })

    return { props: { trpcState: helpers.dehydrate() } }
}

export default function Home(props: { passage?: PassageReference }) {
    const value =
        props.passage ?? passageReferenceSchema.parse(DEFAULT_PASSAGE_REFERENCE)
    const passage = api.passage.passage.useQuery({
        reference: value,
        savePassageResponseToDatabase: true,
    })
    const router = useRouter()

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>
                    Type the Word {router.pathname !== '/' ? `- ${value}` : ''}
                </title>
                <meta
                    name="description"
                    content="A typing practice tool that tracks your typing progress through the Bible. Improve your typing skills while meditating on God's word."
                />
                <meta
                    property="og:image"
                    content={`https://typetheword.site/api/og${
                        props.passage
                            ? `?passage=${passageUrlSchema.parse(
                                  props.passage,
                              )}`
                            : ''
                    }`}
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-4 lg:pt-8">
                <PassageSelector value={value} />
            </div>

            <main className="relative mx-auto w-full flex-grow">
                {router.isFallback || passage.isLoading ? (
                    <Loading />
                ) : passage.error ? (
                    <>We hit a whoopsie! :(</>
                ) : (
                    <Passage
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
