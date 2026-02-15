"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useSession } from "next-auth/react"

import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"
import { fetchChapterHistory } from "~/lib/api"
import { Translation } from "~/lib/parseEsv"
import { PassageSegment } from "~/lib/passageSegment"

export function ChapterLog({
    passageSegment,
    translation = "esv",
    ...props
}: {
    passageSegment: PassageSegment
    translation?: Translation
    chapterHistory: ChapterHistory
}) {
    const { data: sessionData } = useSession()
    const chapterHistory = useQuery({
        queryKey: ["chapter-history", passageSegment, translation],
        queryFn: () => fetchChapterHistory(passageSegment, translation),
        enabled: sessionData?.user?.id != null,
        placeholderData: props.chapterHistory,
    })

    if (!chapterHistory.data || chapterHistory.data.chapterLogs.length === 0)
        return null

    return (
        <div className="mb-24" data-testid="chapter-log">
            <h2>Log</h2>
            <ul className="list-[square]">
                {chapterHistory.data.chapterLogs.map(log => (
                    <li
                        key={log.createdAt.toString()}
                        data-testid="chapter-log-item"
                    >
                        <div className="flex items-center justify-between">
                            <span>{log.location} </span>
                            <span>
                                {format(log.createdAt, "MMMM do, yyyy")}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
