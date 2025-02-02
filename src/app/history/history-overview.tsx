'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import clsx from 'clsx'
import Link from 'next/link'
import { BookOverview } from './overview'

function Box({ percentage }: { percentage: number }) {
    const isComplete = percentage >= 100
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className={clsx('h-full w-full')}
        >
            <rect
                height="14"
                width="14"
                strokeWidth="1"
                className="stroke-primary "
                fill="none"
                x="1"
                y="1"
            />
            <rect
                height="14"
                width={isComplete ? 14 : (percentage * 14) / 100}
                strokeWidth="1"
                className="fill-primary stroke-primary"
                x="1"
                y="1"
            />
            {isComplete && (
                <path
                    fillRule="evenodd"
                    d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                    clipRule="evenodd"
                    className="fill-secondary"
                />
            )}
        </svg>
    )
}

export function HistoryOverview({ overview }: { overview: BookOverview[] }) {
    return (
        <Tooltip.Provider delayDuration={0}>
            <div className="flex flex-col text-primary">
                {overview.map(book => {
                    if (book.alt === 0) return null
                    return (
                        <details key={book.book}>
                            <summary className="svg-outline-stubby relative select-none outline-none">
                                <div className="ml-3 inline-flex w-[calc(100%-32px)] items-center justify-between">
                                    <h3 className="m-0">{book.label}</h3>
                                    <div
                                        className={clsx(
                                            ' font-bold',
                                            // {
                                            //     [` bg-primary px-3 py-1 text-secondary `]:
                                            //         isBookComplete,
                                            // },
                                        )}
                                    >
                                        {book.alt}%
                                    </div>
                                </div>
                            </summary>
                            <div className="grid grid-cols-[repeat(auto-fill,_minmax(max(36px),_1fr))] py-4">
                                {book.chapters.map((chapterOverview, j) => (
                                    <Tooltip.Root key={j}>
                                        <Tooltip.Trigger asChild>
                                            <Link
                                                href={`/passage/${book.book}_${chapterOverview.chapter}`}
                                                prefetch={false}
                                                className="svg-outline-xs relative aspect-square h-full p-1 outline-none"
                                            >
                                                <Box
                                                    percentage={
                                                        chapterOverview.percentage
                                                    }
                                                />
                                            </Link>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content
                                            className="prose grid select-none grid-cols-[1fr_minmax(30px,min-content)] gap-x-3 gap-y-1 border-2 border-primary bg-secondary px-3 py-2 font-sans leading-none text-primary "
                                            sideOffset={2}
                                        >
                                            <div>Chapter: </div>
                                            <div>{chapterOverview.chapter}</div>
                                            <div>Verses: </div>
                                            <div>
                                                {chapterOverview.typedVerses}/
                                                {chapterOverview.verses}
                                            </div>
                                            <div>Completion: </div>
                                            <div>
                                                {chapterOverview.percentage}%
                                            </div>
                                        </Tooltip.Content>
                                    </Tooltip.Root>
                                ))}
                            </div>
                        </details>
                    )
                })}
            </div>
        </Tooltip.Provider>
    )
}
