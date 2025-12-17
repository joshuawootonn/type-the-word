'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'

import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'
import { fetchChapterHistory } from '~/lib/api'
import { PassageSegment } from '~/lib/passageSegment'

export function ChapterLog({
    passageSegment,
    ...props
}: {
    passageSegment: PassageSegment
    chapterHistory: ChapterHistory
}) {
    const { data: sessionData } = useSession()
    const chapterHistory = useQuery({
        queryKey: ['chapter-history', passageSegment],
        queryFn: () => fetchChapterHistory(passageSegment),
        enabled: sessionData?.user?.id != null,
        initialData: props.chapterHistory,
    })

    if (chapterHistory.data.chapterLogs.length === 0) return null

    return (
        <div className="mb-24">
            <h2>Log</h2>
            <ul className="list-[square]">
                {chapterHistory.data.chapterLogs.map(log => (
                    <li key={log.createdAt.toString()}>
                        <div className="flex items-center justify-between">
                            <span>{log.location} </span>
                            <span>
                                {format(log.createdAt, 'MMMM do, yyyy')}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
