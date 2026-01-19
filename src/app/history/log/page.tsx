import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { cookies } from "next/headers"

import { authOptions } from "~/server/auth"

import { getLogData } from "../getHistory"
import { HistoryLogV2 } from "../history-log-2"

export const metadata: Metadata = {
    title: "Type the Word - History Log",
    description: "Log of all the passages you have typed.",
}

export default async function HistoryLogPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return null
    }

    const cookieStore = await cookies()
    const timezoneOffset = parseInt(
        cookieStore.get("timezoneOffset")?.value ?? "0",
    )

    const log = await getLogData(session.user.id, timezoneOffset)

    if (log.length === 0) {
        return (
            <p>
                Once you have typed more verses this section will include
                details on how often you have typed over the past few months.
            </p>
        )
    }

    return <HistoryLogV2 monthLogs={log} />
}
