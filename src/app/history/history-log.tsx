'use client'

import { TypingSessionLog } from './typingSessionToString'
import { Fragment } from 'react'
import { format } from 'date-fns'

export function HistoryLog({ log }: { log: TypingSessionLog[] }) {
    return (
        <>
            {log.map((entry, i) => {
                const date = new Date(entry.createdAt)
                return (
                    <Fragment key={i}>
                        <div className="hidden w-full grow flex-row items-center justify-between text-xl md:flex">
                            <p className="shrink-0">{entry.location}</p>
                            <svg
                                height={2}
                                className={'mx-4 inline grow'}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <line
                                    className="stroke-primary"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray="6 5"
                                    x="0"
                                    y="0"
                                    x2="100%"
                                    y2="0"
                                />
                            </svg>

                            <p className="shrink-0">
                                {format(date, 'haaa')} {'- '}
                                {format(date, 'MM/dd')}
                            </p>
                        </div>

                        <div
                            className="not-prose mb-2 flex w-full grow flex-col md:hidden"
                            key={entry.createdAt.toString()}
                        >
                            <div className="flex items-center">
                                <p className="max-w-full shrink-0 whitespace-pre-wrap">
                                    {entry.location}
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <svg
                                    height={2}
                                    className={'mr-4 inline grow'}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <line
                                        className="stroke-primary"
                                        strokeWidth="4"
                                        fill="transparent"
                                        strokeDasharray="6 5"
                                        x="0"
                                        y="0"
                                        x2="100%"
                                        y2="0"
                                    />
                                </svg>
                                <p className="shrink-0">
                                    {format(date, 'haaa')} {'- '}
                                    {format(date, 'MM/dd')}
                                </p>
                            </div>
                        </div>
                    </Fragment>
                )
            })}
        </>
    )
}
