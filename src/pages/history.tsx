import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { api } from '~/utils/api'
import { format } from 'date-fns'
import { Footer } from '~/components/footer'
import { Loading } from '~/components/loading'
import clsx from 'clsx'
import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { Fragment } from 'react'

export default function History() {
    const log = api.typingSession.getLog.useQuery()
    const overview = api.typingSession.getHistoryOverview.useQuery()

    return (
        <div className="min-h-screen-1px container mx-auto flex max-w-page flex-col px-4 dark:text-white lg:px-0">
            <Head>
                <title>Type the Word - History</title>
                <meta
                    name="description"
                    content="History of all the passages you have typed."
                />
                <meta
                    property="og:image"
                    content="https://typetheword.site/api/og?path=history"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navigation />
            <main className="prose mx-auto mb-8 w-full flex-grow pt-4 text-lg dark:prose-invert dark:text-white lg:pt-8">
                <h1 className="">History</h1>
                <hr className="mx-0 w-full border-t-2 border-black dark:border-white dark:text-white" />
                <h2>Overview</h2>
                <Tooltip.Provider>
                    {overview.isLoading ? (
                        <Loading initialDots={2} />
                    ) : overview.error ? (
                        <div>We hit a whoopsie! :(</div>
                    ) : (
                        <div>
                            <div className="flex flex-col">
                                {overview.data.map(book => {
                                    if (book.percentage === 0) return null
                                    return (
                                        <details key={book.book}>
                                            <summary className="svg-outline-stubby relative select-none outline-none">
                                                <div className="ml-3 inline-flex w-[calc(100%-32px)] items-center justify-between">
                                                    <h3 className="m-0">
                                                        {book.label}
                                                    </h3>
                                                    <div
                                                        className={clsx(
                                                            ' font-bold',
                                                            // {
                                                            //     [` bg-black px-3 py-1 text-white dark:bg-white dark:text-black`]:
                                                            //         isBookComplete,
                                                            // },
                                                        )}
                                                    >
                                                        {book.percentage}%
                                                    </div>
                                                </div>
                                            </summary>
                                            <div className="grid grid-cols-[repeat(auto-fill,_minmax(max(28px),_1fr))] p-4">
                                                {book.chapters.map(
                                                    (chapterOverview, j) => {
                                                        const isComplete =
                                                            chapterOverview.percentage >=
                                                            100
                                                        return (
                                                            <Tooltip.Root
                                                                key={j}
                                                            >
                                                                <Tooltip.Trigger
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={`/passage/${book.book}_${chapterOverview.chapter}`}
                                                                        prefetch={
                                                                            false
                                                                        }
                                                                        className="svg-outline-xs relative aspect-square h-full p-1 outline-none"
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 16 16"
                                                                            className={clsx(
                                                                                'h-full w-full border-2 border-black text-white dark:border-white dark:text-black',
                                                                            )}
                                                                        >
                                                                            <rect
                                                                                height="18"
                                                                                width={
                                                                                    isComplete
                                                                                        ? 18
                                                                                        : (chapterOverview.percentage *
                                                                                              18) /
                                                                                          100
                                                                                }
                                                                                fill="currentColor"
                                                                                className="invert"
                                                                                x="-1"
                                                                                y="-1"
                                                                            />
                                                                            {isComplete && (
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                                                                    clipRule="evenodd"
                                                                                    fill={
                                                                                        'currentColor'
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </svg>
                                                                    </Link>
                                                                </Tooltip.Trigger>
                                                                <Tooltip.Content
                                                                    className="prose grid select-none grid-cols-[1fr_minmax(30px,min-content)] gap-x-3 gap-y-1 border-2 border-black bg-white px-3 py-2 font-sans leading-none text-black dark:border-white dark:bg-black dark:text-white"
                                                                    sideOffset={
                                                                        2
                                                                    }
                                                                >
                                                                    <div>
                                                                        Chapter:{' '}
                                                                    </div>
                                                                    <div>
                                                                        {
                                                                            chapterOverview.chapter
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        Verses:{' '}
                                                                    </div>
                                                                    <div>
                                                                        {
                                                                            chapterOverview.typedVerses
                                                                        }
                                                                        /
                                                                        {
                                                                            chapterOverview.verses
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        Completion:{' '}
                                                                    </div>
                                                                    <div>
                                                                        {
                                                                            chapterOverview.percentage
                                                                        }
                                                                        %
                                                                    </div>
                                                                </Tooltip.Content>
                                                            </Tooltip.Root>
                                                        )
                                                    },
                                                )}
                                            </div>
                                        </details>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </Tooltip.Provider>
                <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />
                <h2>Log</h2>
                {log.isLoading ? (
                    <Loading />
                ) : log.error ? (
                    <div>We hit a whoopsie! :(</div>
                ) : (
                    log.data.map((entry, i) => {
                        return (
                            <Fragment key={i}>
                                <div className="hidden w-full grow flex-row items-center justify-between text-xl md:flex">
                                    <span className="shrink-0">
                                        {entry.location}
                                    </span>
                                    <svg
                                        height={2}
                                        className={'mx-4 inline grow'}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <line
                                            stroke="black"
                                            strokeWidth="4"
                                            fill="transparent"
                                            strokeDasharray="6 5"
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

                                <div
                                    className="not-prose mb-2 flex w-full grow flex-col md:hidden"
                                    key={entry.createdAt.toString()}
                                >
                                    <div className="flex items-center">
                                        <span className="max-w-full shrink-0 whitespace-pre-wrap">
                                            {entry.location}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <svg
                                            height={2}
                                            className={'mr-4 inline grow'}
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <line
                                                stroke="black"
                                                strokeWidth="4"
                                                fill="transparent"
                                                strokeDasharray="6 5"
                                                x="0"
                                                y="0"
                                                x2="100%"
                                                y2="0"
                                            />
                                        </svg>
                                        <div className="shrink-0">
                                            {format(entry.createdAt, 'haaa')}{' '}
                                            {'- '}
                                            {format(entry.createdAt, 'MM/dd')}
                                        </div>
                                    </div>
                                </div>
                            </Fragment>
                        )
                    })
                )}
            </main>
            <Footer />
        </div>
    )
}
