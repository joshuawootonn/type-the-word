import Head from 'next/head'

import { Navigation } from '~/components/navigation'
import { api } from '~/utils/api'
import { Footer } from '~/components/footer'
import { Loading } from '~/components/loading'
import clsx from 'clsx'
import Link from 'next/link'
import { EmailLink } from '~/components/emailLink'

export default function Home() {
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
                <h1 className="">Overview (WIP)</h1>
                <p>
                    Type the word needs a better way of getting a macro
                    progress view. This is the home of that for now. That is
                    subject to change. I have yet to think how/if this will
                    overlap with the history page.{' '}
                    <EmailLink>Email me</EmailLink> if you have a preference.
                </p>
                <hr className="mx-0 w-full border-t-2 border-black dark:border-white dark:text-white" />
                <h2>Overview</h2>
                {overview.isLoading ? (
                    <Loading initialDots={2} />
                ) : overview.error ? (
                    <div>We hit a whoopsie! :(</div>
                ) : (
                    <div>
                        <div className="flex flex-col">
                            {overview.data.map(book => {
                                // const isBookComplete = true
                                if (book.percentage === 0) return null
                                const isBookComplete = book.percentage >= 100
                                return (
                                    <details key={book.book}>
                                        <summary className="select-none">
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
                                        <div className="grid grid-cols-[repeat(auto-fill,_minmax(max(16px),_1fr))] gap-2 p-4">
                                            {book.chapters.map(
                                                (chapterOverview, j) => {
                                                    // const isComplete = true
                                                    const isComplete =
                                                        chapterOverview.percentage >=
                                                        100
                                                    return (
                                                        <div
                                                            key={j}
                                                            className={clsx(
                                                                'relative h-4 w-4 border-2 border-black dark:border-white',
                                                            )}
                                                        >
                                                            <Link
                                                                href={`/passage/${book.book}_${chapterOverview.chapter}`}
                                                                prefetch={false}
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 16 16"
                                                                    className={clsx(
                                                                        'h-full w-full text-white dark:text-black',
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
                                                        </div>
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
            </main>
            <Footer />
        </div>
    )
}
