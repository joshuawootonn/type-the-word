import React, { useMemo } from "react"

import { PassageRectContext } from "~/lib/hooks/passageRectContext"
import { Verse } from "~/lib/parseEsv"
import { TypedVerse } from "~/server/repositories/typingSession.repository"

export function TypedVerseLines({
    orderedVerses,
    passageRect,
    typedVerses,
    verseRects,
    padding = 0,
}: {
    orderedVerses: Verse[]
    passageRect: DOMRect | null
    typedVerses: TypedVerse[] | undefined
    verseRects: PassageRectContext["verseRects"]
    padding?: number
}) {
    const typedVerseRanges = useMemo<
        { top: number; bottom: number; key: string }[]
    >(() => {
        if (!passageRect) return []

        const typedVerseSet = new Set(
            typedVerses?.map(
                typed =>
                    `${typed.book}:${typed.chapter}:${typed.verse}:${typed.translation}`,
            ) ?? [],
        )

        const ranges: { top: number; bottom: number; key: string }[] = []
        let current: { top: number; bottom: number; lastIndex: number } | null =
            null

        orderedVerses.forEach((verse, index) => {
            const verseKey = verse.verse.text + verse.metadata.offset
            const rect = verseRects[verseKey]
            const isTyped = typedVerseSet.has(
                `${verse.verse.book}:${verse.verse.chapter}:${verse.verse.verse}:${verse.verse.translation}`,
            )

            if (rect && isTyped) {
                const top = rect.top - passageRect.top
                const bottom = rect.bottom - passageRect.top

                if (current && current.lastIndex === index - 1) {
                    current.top = Math.min(current.top, top)
                    current.bottom = Math.max(current.bottom, bottom)
                    current.lastIndex = index
                } else {
                    if (current != null) {
                        ranges.push({
                            top: current.top,
                            bottom: current.bottom,
                            key: `${current.top}-${current.bottom}`,
                        })
                    }
                    current = { top, bottom, lastIndex: index }
                }
            } else if (current != null) {
                ranges.push({
                    top: current.top,
                    bottom: current.bottom,
                    key: `${current.top}-${current.bottom}`,
                })
                current = null
            }
        })

        if (current != null) {
            const currentValue = current as { top: number; bottom: number }
            ranges.push({
                top: currentValue.top,
                bottom: currentValue.bottom,
                key: `${currentValue.top}-${currentValue.bottom}`,
            })
        }

        return ranges
    }, [orderedVerses, passageRect, typedVerses, verseRects])

    return (
        <>
            {typedVerseRanges.map((range, index) => {
                const height = range.bottom - range.top + padding * 2
                return (
                    <svg
                        key={index}
                        className="pointer-events-none absolute -left-3 right-full z-0 w-4 rounded-none transition-[height] duration-200 ease-in-out md:-left-6"
                        style={{
                            height,
                            top: range.top - padding,
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <line
                            className="stroke-primary"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            x1="5px"
                            y1="0%"
                            x2="5px"
                            y2="100%"
                        />
                    </svg>
                )
            })}
        </>
    )
}
