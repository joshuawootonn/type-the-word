"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import clsx from "clsx"
import {
    eachWeekOfInterval,
    endOfMonth,
    format,
    isAfter,
    isEqual,
    startOfMonth,
    interval,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isWithinInterval,
    isSameYear,
    endOfToday,
} from "date-fns"

import { MonthlyLogDTO } from "./log2"

function isThisMonth(date: Date) {
    const beginningOfTheMonth = startOfMonth(new Date())
    return isEqual(date, beginningOfTheMonth)
}

function isInThisYear(date: Date) {
    return isSameYear(date, new Date())
}

function isInTheFuture(date: Date) {
    return isAfter(date, endOfToday())
}

export function HistoryLogV2({ monthLogs }: { monthLogs: MonthlyLogDTO[] }) {
    return (
        <div className="mb-24">
            <Tooltip.Provider delayDuration={0}>
                {monthLogs.map((monthLog, i) => {
                    const month = new Date(monthLog.year, monthLog.month)
                    const monthInterval = interval(
                        startOfMonth(month),
                        endOfMonth(month),
                    )
                    const sundays = eachWeekOfInterval(monthInterval).reverse()

                    const weekIntervals = sundays.map(sunday =>
                        interval(startOfWeek(sunday), endOfWeek(sunday)),
                    )

                    const daysGroupedByWeek = weekIntervals.map(weekInterval =>
                        eachDayOfInterval(weekInterval),
                    )

                    return (
                        <div
                            key={i}
                            className="flex flex-col items-start justify-between md:flex-row"
                        >
                            <div>
                                <h3 className="mt-0">
                                    {isThisMonth(month)
                                        ? "This Month"
                                        : isInThisYear(month)
                                          ? format(month, "MMMM")
                                          : format(month, "MMMM, yyyy")}
                                </h3>
                                <p>Verses: {monthLog.numberOfVersesTyped}</p>
                            </div>
                            <div className="relative mb-2 flex w-full flex-col gap-2 md:w-auto">
                                {daysGroupedByWeek.map((weekOfDays, j) => {
                                    const isLastWeekOfMonth =
                                        j === daysGroupedByWeek.length - 1
                                    const firstDay = weekOfDays.at(0)
                                    const lastDay = weekOfDays.at(-1)

                                    const isWeekContainedInMonth =
                                        firstDay && lastDay
                                            ? isWithinInterval(
                                                  firstDay,
                                                  monthInterval,
                                              ) &&
                                              isWithinInterval(
                                                  lastDay,
                                                  monthInterval,
                                              )
                                            : false
                                    return (
                                        <div
                                            className={clsx(
                                                "grid w-full grid-cols-7 gap-2 md:flex",
                                                isLastWeekOfMonth &&
                                                    "justify-end",
                                                isLastWeekOfMonth &&
                                                    !isWeekContainedInMonth &&
                                                    "block md:absolute md:right-0 md:bottom-0 md:translate-y-[calc(100%+8px)]",
                                            )}
                                            key={j}
                                        >
                                            {weekOfDays.map((day, k) => {
                                                const isInMonth =
                                                    isWithinInterval(
                                                        day,
                                                        monthInterval,
                                                    )
                                                const isFuture =
                                                    isInTheFuture(day)

                                                if (!isInMonth) return null

                                                const dayLog =
                                                    isInMonth &&
                                                    monthLog.days[
                                                        format(day, "dd")
                                                    ]

                                                return (
                                                    <Tooltip.Root key={k}>
                                                        <Tooltip.Trigger
                                                            asChild
                                                        >
                                                            <div
                                                                className={clsx(
                                                                    "border-primary relative flex aspect-square items-center justify-center border-2 md:size-14",
                                                                    dayLog &&
                                                                        "border-primary bg-primary text-secondary",
                                                                    isFuture &&
                                                                        "opacity-20",
                                                                )}
                                                            >
                                                                <div className="absolute top-0 left-0 px-px text-xs">
                                                                    {format(
                                                                        day,
                                                                        "d",
                                                                    )}
                                                                </div>
                                                                {
                                                                    dayLog?.numberOfVersesTyped
                                                                }
                                                            </div>
                                                        </Tooltip.Trigger>
                                                        {dayLog && (
                                                            <Tooltip.Content
                                                                sideOffset={8}
                                                                className="typo:prose border-primary bg-secondary text-primary grid grid-cols-[1fr_minmax(30px,min-content)] gap-x-3 gap-y-2 border-2 px-3 py-2 font-sans leading-none select-none"
                                                            >
                                                                <div className="font-medium">
                                                                    Date:{" "}
                                                                </div>
                                                                <div className="space-y-2 whitespace-nowrap">
                                                                    {format(
                                                                        day,
                                                                        "MMMM do",
                                                                    )}
                                                                </div>
                                                                <div className="font-medium">
                                                                    Location:{" "}
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {dayLog.location.map(
                                                                        (
                                                                            loc,
                                                                            l,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    l
                                                                                }
                                                                                className="whitespace-nowrap"
                                                                            >
                                                                                {
                                                                                    loc
                                                                                }
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </Tooltip.Content>
                                                        )}
                                                    </Tooltip.Root>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </Tooltip.Provider>
        </div>
    )
}
