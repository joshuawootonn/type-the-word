'use client'

import { useState } from 'react'

import { Tabs, TabsList, TabsTab, TabsPanel } from '~/components/ui/tabs'

import { HistoryLogV2 } from './history-log-2'
import { HistoryOverview } from './history-overview'
import { MonthlyLogDTO } from './log2'
import { BookOverview } from './overview'
import { VerseStatsWithDate } from './wpm'
import { WPMChart } from './wpm-chart'

type TabValue = 'overview' | 'wpm' | 'log'

function setHistoryTabCookie(tab: TabValue) {
    document.cookie = `historyTab=${tab}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`
}

export function HistoryTabs({
    overview,
    log2,
    allVerseStats,
    showWpmChart,
    initialTab,
    useOptimizedHistory,
}: {
    overview: BookOverview[]
    log2: MonthlyLogDTO[]
    allVerseStats: VerseStatsWithDate[]
    showWpmChart: boolean
    initialTab: TabValue
    useOptimizedHistory: boolean
}) {
    // If the saved tab was 'wpm' but the feature is disabled, fall back to 'overview'
    const validatedInitialTab =
        initialTab === 'wpm' && !showWpmChart ? 'overview' : initialTab

    const [activeTab, setActiveTab] = useState<TabValue>(validatedInitialTab)

    const handleTabChange = (value: TabValue | null) => {
        if (value) {
            setActiveTab(value)
            setHistoryTabCookie(value)
        }
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
                <TabsTab value="overview">
                    Overview
                    {showWpmChart && useOptimizedHistory && (
                        <div className="ml-2 inline-block -translate-y-[1px] border-1.5 border-primary px-1.5 py-0.5 text-xs font-medium text-primary">
                            new
                        </div>
                    )}
                </TabsTab>
                <TabsTab value="log">Log</TabsTab>
                {showWpmChart && (
                    <TabsTab value="wpm">
                        WPM + Accuracy
                        <div className="ml-2 inline-block -translate-y-[1px] border-1.5 border-primary px-1.5 py-0.5 text-xs font-medium text-primary">
                            beta
                        </div>
                    </TabsTab>
                )}
            </TabsList>

            <TabsPanel value="overview">
                <div className="flex items-center gap-2"></div>
                {overview.length === 0 ? (
                    <p>
                        Once you have typed more verses this section will
                        include details on what books of the bible you have
                        typed through.
                    </p>
                ) : (
                    <HistoryOverview overview={overview} />
                )}
            </TabsPanel>

            {showWpmChart && (
                <TabsPanel value="wpm">
                    <WPMChart allStats={allVerseStats} />
                </TabsPanel>
            )}

            <TabsPanel value="log">
                {log2.length === 0 ? (
                    <p>
                        Once you have typed more verses this section will
                        include details on how often you have typed over the
                        past few months.
                    </p>
                ) : (
                    <HistoryLogV2 monthLogs={log2} />
                )}
            </TabsPanel>
        </Tabs>
    )
}
