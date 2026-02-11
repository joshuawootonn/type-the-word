"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import clsx from "clsx"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { tryParseTranslation } from "~/lib/translations"

import { BookOverview } from "./overview"

function Box({
    percentage,
    className,
}: {
    percentage: number
    className?: string
}) {
    const isComplete = percentage >= 100
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            className={clsx(className)}
        >
            <rect
                height="14"
                width="14"
                strokeWidth="1"
                className="stroke-primary"
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
    const searchParams = useSearchParams()
    const currentTranslation =
        tryParseTranslation(searchParams?.get("translation")) ?? "esv"

    return (
        <Tooltip.Provider delayDuration={0}>
            <div className="text-primary flex flex-col">
                {overview.map(book => {
                    return (
                        <details key={book.book}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <summary className="svg-outline-stubby relative outline-hidden select-none">
                                        <div className="ml-3 inline-flex w-[calc(100%-32px)] items-center justify-between">
                                            <h3 className="m-0 grow">
                                                {book.label}
                                            </h3>

                                            <div className="flex flex-row items-center justify-end gap-2">
                                                {new Array(book.prestige)
                                                    .fill(null)
                                                    .map((_, i) => (
                                                        <Box
                                                            className={
                                                                "aspect-square h-[28.5px]"
                                                            }
                                                            key={i}
                                                            percentage={100}
                                                        />
                                                    ))}
                                                {book.percentage !== 0 && (
                                                    <Box
                                                        className={
                                                            "aspect-square h-[28.5px]"
                                                        }
                                                        percentage={
                                                            book.percentage
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </summary>
                                </Tooltip.Trigger>
                            </Tooltip.Root>
                            <div>
                                <div className="typo:prose text-primary flex flex-col gap-x-3 gap-y-2 pt-4 leading-4">
                                    {book.prestige > 0 && (
                                        <div>
                                            Times completed: {book.prestige}
                                        </div>
                                    )}
                                    <div>
                                        Current Progress: {book.typedVerses} /{" "}
                                        {book.verses}
                                    </div>
                                    <div>
                                        Current Completion: {book.percentage}%
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(max(36px),1fr))] py-4">
                                {book.chapters.map((chapterOverview, j) => (
                                    <Tooltip.Root key={j}>
                                        <Tooltip.Trigger asChild>
                                            <Link
                                                href={`/passage/${book.book}_${chapterOverview.chapter}?translation=${currentTranslation}`}
                                                prefetch={false}
                                                className="svg-outline-xs relative aspect-square h-full p-1 outline-hidden"
                                            >
                                                <Box
                                                    percentage={
                                                        chapterOverview.percentage
                                                    }
                                                />
                                            </Link>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content
                                            className="typo:prose border-primary bg-secondary text-primary grid grid-cols-[1fr_minmax(30px,min-content)] gap-x-3 gap-y-1 border-2 px-3 py-2 font-sans leading-none select-none"
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
