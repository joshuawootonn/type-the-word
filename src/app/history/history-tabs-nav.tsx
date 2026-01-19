"use client"

import clsx from "clsx"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"

import { cn } from "~/lib/cn"
import { tryParseTranslation } from "~/lib/translations"

type TabValue = "overview" | "wpm" | "log"

function pathToTab(pathname: string): TabValue {
    if (pathname === "/history/log") return "log"
    if (pathname === "/history/wpm") return "wpm"
    return "overview"
}

function TabLink({
    href,
    isActive,
    onClick,
    children,
}: {
    href: string
    isActive: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            prefetch
            onClick={onClick}
            className={clsx(
                "flex cursor-pointer",
                "svg-outline relative no-underline outline-none",
            )}
        >
            <div
                className={cn(
                    "px-4 py-2 text-primary",
                    isActive ? "bg-secondary invert" : undefined,
                )}
            >
                {children}
            </div>
        </Link>
    )
}

export function HistoryTabsNav({ showWpmChart }: { showWpmChart: boolean }) {
    const pathname = usePathname() ?? "/history"
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<TabValue>(() =>
        pathToTab(pathname),
    )

    // Get current translation from URL to preserve it across tab navigation
    const currentTranslation =
        tryParseTranslation(searchParams?.get("translation")) ?? "esv"
    const translationParam = `?translation=${currentTranslation}`

    return (
        <div className="relative mb-8 flex gap-1 border-b-2 border-primary">
            <TabLink
                href={`/history${translationParam}`}
                isActive={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
            >
                Overview
            </TabLink>
            <TabLink
                href={`/history/log${translationParam}`}
                isActive={activeTab === "log"}
                onClick={() => setActiveTab("log")}
            >
                Log
            </TabLink>
            {showWpmChart && (
                <TabLink
                    href={`/history/wpm${translationParam}`}
                    isActive={activeTab === "wpm"}
                    onClick={() => setActiveTab("wpm")}
                >
                    WPM + Accuracy
                    <div className="ml-2 inline-block -translate-y-[1px] border-1.5 border-primary px-1.5 py-0.5 text-xs font-medium text-primary">
                        beta
                    </div>
                </TabLink>
            )}
        </div>
    )
}
