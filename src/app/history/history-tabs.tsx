'use client'

import { ReactNode, useState } from 'react'

import { Tabs, TabsList, TabsTab, TabsPanel } from '~/components/ui/tabs'

type TabValue = 'overview' | 'wpm' | 'log'

function setHistoryTabCookie(tab: TabValue) {
    document.cookie = `historyTab=${tab}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`
}

export function HistoryTabs({
    showWpmChart,
    initialTab,
    useOptimizedHistory,
    overviewContent,
    logContent,
    wpmContent,
}: {
    showWpmChart: boolean
    initialTab: TabValue
    useOptimizedHistory: boolean
    overviewContent: ReactNode
    logContent: ReactNode
    wpmContent: ReactNode
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

            <TabsPanel value="overview" keepMounted={false}>
                {overviewContent}
            </TabsPanel>

            <TabsPanel value="log" keepMounted={false}>
                {logContent}
            </TabsPanel>

            {showWpmChart && (
                <TabsPanel value="wpm" keepMounted={false}>
                    {wpmContent}
                </TabsPanel>
            )}
        </Tabs>
    )
}
