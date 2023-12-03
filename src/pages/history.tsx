import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { api } from '~/utils/api'
import { format } from 'date-fns'
import { Footer } from '~/components/footer'
import { Loading } from '~/components/loading'

export default function Home() {
    const log = api.typingSession.getLog.useQuery()
    const summary = api.typingSession.getHistorySummary.useQuery()

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 lg:px-0">
            <Head>
                <title>Type the Word - History</title>
                <meta
                    name="description"
                    content="History of all the passages you have typed."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <main className="prose mx-auto mb-8 w-full flex-grow pt-4 lg:pt-8">
                <h1 className="">History</h1>
                <hr className="mx-0 w-full border-t-2 border-black" />
                <h2>Summary</h2>
                {summary.isLoading ? (
                    <Loading initialDots={2} />
                ) : summary.error ? (
                    <div>We hit a whoopsie! :(</div>
                ) : (
                    <div className="flex flex-row gap-3">
                        {summary.data.map(entry => {
                            return (
                                <div
                                    className="relative z-0 h-40 w-40 border-2 border-black"
                                    key={entry.book}
                                >
                                    <div className="max-w-[fit-content] bg-black px-2 text-white">
                                        {entry.label}
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                        {Math.floor(
                                            (entry.typedVerses /
                                                entry.totalVerses) *
                                                10000,
                                        ) / 100}
                                        %
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                <hr className="mx-0 w-full border-t-2 border-black" />
                <h2>Log</h2>
                {log.isLoading ? (
                    <Loading />
                ) : log.error ? (
                    <div>We hit a whoopsie! :(</div>
                ) : (
                    log.data.map(entry => {
                        return (
                            <div
                                className="flex w-full grow flex-row items-center justify-between"
                                key={entry.createdAt.toString()}
                            >
                                <span className="shrink-0">
                                    {entry.location}
                                </span>
                                <svg
                                    height={2}
                                    className={'mx-4 grow'}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <line
                                        stroke="black"
                                        stroke-width="4"
                                        fill="transparent"
                                        stroke-dasharray="6 5"
                                        x="0"
                                        y="0"
                                        x2="100%"
                                        y2="0"
                                    />
                                </svg>

                                <span className="shrink-0">
                                    {format(entry.createdAt, 'haaa')} {'- '}
                                    {format(entry.createdAt, 'MM/dd')}
                                </span>
                            </div>
                        )
                    })
                )}
            </main>
            <Footer />
        </div>
    )
}
