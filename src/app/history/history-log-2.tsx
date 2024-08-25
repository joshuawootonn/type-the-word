'use client'

import {
    eachWeekOfInterval,
    endOfMonth,
    format,
    isAfter,
    isEqual,
    startOfMonth,
    startOfYear,
    interval,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isWithinInterval,
} from 'date-fns'
import { MonthlyLogDTO } from './log2'
import clsx from 'clsx'
import * as Tooltip from '@radix-ui/react-tooltip'

function isThisMonth(date: Date) {
    const beginningOfTheMonth = startOfMonth(new Date())
    return isEqual(date, beginningOfTheMonth)
}
function isInThisYear(date: Date) {
    return isAfter(date, startOfYear(new Date()))
}

export function HistoryLogV2({ monthLogs }: { monthLogs: MonthlyLogDTO[] }) {
    return (
        <Tooltip.Provider delayDuration={0}>
            {monthLogs.map((monthLog, i) => {
                const monthInterval = interval(
                    startOfMonth(monthLog.month),
                    endOfMonth(monthLog.month),
                )
                const sundays = eachWeekOfInterval(monthInterval).reverse()

                const weekIntervals = sundays.map(sunday =>
                    interval(startOfWeek(sunday), endOfWeek(sunday)),
                )

                const daysGroupedByWeek = weekIntervals.map(weekInterval =>
                    eachDayOfInterval(weekInterval),
                )

                return (
                    <div key={i} className="flex items-start justify-between">
                        <div>
                            <h3 className="mt-0">
                                {isThisMonth(monthLog.month)
                                    ? 'This Month'
                                    : isInThisYear(monthLog.month)
                                    ? format(monthLog.month, 'MMMM')
                                    : format(monthLog.month, 'MMMM, yyyy')}
                            </h3>
                            <p>Verses: {monthLog.numberOfVersesTyped}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {daysGroupedByWeek.map((weekOfDays, j) => (
                                <div className="flex gap-2" key={j}>
                                    {weekOfDays.map((day, k) => {
                                        const isInMonth = isWithinInterval(
                                            day,
                                            monthInterval,
                                        )
                                        if (!isInMonth)
                                            return <div className="size-12" />

                                        const dayLog =
                                            monthLog.days[day.getDate()]

                                        return (
                                            <Tooltip.Root key={k}>
                                                <Tooltip.Trigger asChild>
                                                    <div
                                                        className={clsx(
                                                            'flex size-12 items-center justify-center border-2 border-primary',
                                                            !isInMonth &&
                                                                'opacity-0',
                                                            dayLog &&
                                                                'border-primary bg-primary text-secondary',
                                                        )}
                                                    >
                                                        {format(day, 'd')}
                                                    </div>
                                                </Tooltip.Trigger>
                                                {dayLog && (
                                                    <Tooltip.Content
                                                        sideOffset={8}
                                                        className="prose grid select-none grid-cols-[1fr_minmax(30px,min-content)] gap-x-3 gap-y-2 border-2 border-primary bg-secondary px-3 py-2 font-sans leading-none text-primary"
                                                    >
                                                        <div className="font-medium">
                                                            Location:{' '}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {dayLog.location.map(
                                                                (loc, l) => (
                                                                    <div
                                                                        key={l}
                                                                        className="whitespace-nowrap"
                                                                    >
                                                                        {loc}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                        <div className="font-medium">
                                                            Verses:
                                                        </div>
                                                        <div>
                                                            {
                                                                dayLog.numberOfVersesTyped
                                                            }
                                                        </div>
                                                    </Tooltip.Content>
                                                )}
                                            </Tooltip.Root>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </Tooltip.Provider>
    )
}
