'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import clsx from 'clsx'
import Link from 'next/link'
import { BookOverview } from './overview'

export function HistoryOverview({ overview }: { overview: BookOverview[] }) {
    return (
        <Tooltip.Provider>
            <div className="flex flex-col">
                {overview.map(book => {
                    if (book.percentage === 0) return null
                    return (
                        <details key={book.book}>
                            <summary className="svg-outline-stubby relative select-none outline-none">
                                <div className="ml-3 inline-flex w-[calc(100%-32px)] items-center justify-between">
                                    <h3 className="m-0">{book.label}</h3>
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
                                {book.chapters.map((chapterOverview, j) => {
                                    const isComplete =
                                        chapterOverview.percentage >= 100
                                    return (
                                        <Tooltip.Root key={j}>
                                            <Tooltip.Trigger asChild>
                                                <Link
                                                    href={`/passage/${book.book}_${chapterOverview.chapter}`}
                                                    prefetch={false}
                                                    className="svg-outline-xs relative aspect-square h-full p-1 outline-none"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 16 16"
                                                        className={clsx(
                                                            'h-full w-full border-2 border-black dark:border-white',
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
                                                            className="fill-black dark:fill-white"
                                                            x="-1"
                                                            y="-1"
                                                        />
                                                        {isComplete && (
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                                                clipRule="evenodd"
                                                                className="fill-white dark:fill-black"
                                                            />
                                                        )}
                                                    </svg>
                                                </Link>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content
                                                className="prose grid select-none grid-cols-[1fr_minmax(30px,min-content)] gap-x-3 gap-y-1 border-2 border-black bg-white px-3 py-2 font-sans leading-none text-black dark:border-white dark:bg-black dark:text-white"
                                                sideOffset={2}
                                            >
                                                <div>Chapter: </div>
                                                <div>
                                                    {chapterOverview.chapter}
                                                </div>
                                                <div>Verses: </div>
                                                <div>
                                                    {
                                                        chapterOverview.typedVerses
                                                    }
                                                    /{chapterOverview.verses}
                                                </div>
                                                <div>Completion: </div>
                                                <div>
                                                    {chapterOverview.percentage}
                                                    %
                                                </div>
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    )
                                })}
                            </div>
                        </details>
                    )
                })}
            </div>
        </Tooltip.Provider>
    )
}
