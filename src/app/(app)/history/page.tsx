import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { Suspense } from "react"

import { historyTranslationSchema } from "~/lib/translations"
import { authOptions } from "~/server/auth"

import { getOverviewData } from "./getHistory"
import { HistoryOverview } from "./history-overview"
import { TranslationSelector } from "./translation-selector"

export const metadata: Metadata = {
    title: "Type the Word - History",
    description: "History of all the passages you have typed.",
}

export default async function HistoryOverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ translation?: string }>
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return null
    }

    const { translation: translationParam } = await searchParams
    const translation = historyTranslationSchema.parse(translationParam)

    const overview = await getOverviewData(session.user.id, translation)

    return (
        <>
            <div className="mb-4 flex justify-end">
                <Suspense fallback={null}>
                    <TranslationSelector />
                </Suspense>
            </div>
            {overview.length === 0 ? (
                <p>
                    Once you have typed more verses this section will include
                    details on what books of the bible you have typed through.
                </p>
            ) : (
                <HistoryOverview overview={overview} />
            )}
        </>
    )
}
