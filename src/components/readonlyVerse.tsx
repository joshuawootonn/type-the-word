import clsx from "clsx"
import { useAtom, useSetAtom } from "jotai"
import { useRef } from "react"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"
import {
    currentVerseAtom,
    isPassageActiveAtom,
    keystrokesAtom,
    positionAtom,
} from "~/components/passage"
import { usePassageRect, useVerseRect } from "~/lib/hooks/passageRectContext"
import { isVerseTypedInHistory } from "~/lib/isVerseTypedInHistory"
import { Verse } from "~/lib/parseEsv"

type VerseNode = Verse["nodes"][number]

function Atom({ atom, isIndented }: { atom: VerseNode; isIndented: boolean }) {
    if (atom.type === "newLine") return <br />

    if (atom.type === "verseNumber") {
        return (
            <b className={clsx(isIndented && "absolute left-0")}>
                {atom.text.split(":").at(-1)}
            </b>
        )
    }

    if (atom.type === "space") {
        return (
            <span
                className={clsx(
                    "space inline-flex h-[19px] w-[1ch] translate-y-[3px]",
                )}
            >
                &nbsp;
            </span>
        )
    }

    if (atom.type === "decoration" || atom.type === "tableColumnBreak") {
        return null
    }

    if (atom.type === "word") {
        const wordText = atom.letters.join("").replace(" ", "\u00a0")
        const styleClass = atom.divineName
            ? "divine-name"
            : atom.oldTestamentReference
              ? "old-testament-reference"
              : ""

        // Use small-caps-like rendering for divine names and NASB OT quote text.
        // Keep spans adjacent to avoid preserved whitespace with break-spaces.
        if (styleClass && wordText.length > 1) {
            const firstLetter = wordText[0]
            const rest = wordText.slice(1)
            return (
                <span className="word">
                    <span>{firstLetter}</span>
                    <span className={styleClass}>{rest}</span>
                    <span className="text-[0px]"> </span>
                </span>
            )
        }

        return (
            <span className="word">
                {wordText}
                <span className="text-[0px]"> </span>
            </span>
        )
    }

    return null
}

export function ReadonlyVerse({
    isCurrentVerse,
    isIndented,
    verse,
    history,
}: {
    isCurrentVerse: boolean
    isIndented: boolean
    verse: Verse
    history?: ChapterHistory | AssignmentHistory
}) {
    const passageRect = usePassageRect()
    const [isPassageActive] = useAtom(isPassageActiveAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useVerseRect(ref, verse.verse.text + verse.metadata.offset)

    const isTypedInHistory = isVerseTypedInHistory(
        history,
        verse.verse.chapter,
        verse.verse.verse,
    )

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)
    const setPosition = useSetAtom(positionAtom)
    const setKeystrokes = useSetAtom(keystrokesAtom)
    const hasTableColumns = verse.nodes.some(
        atom => atom.type === "tableColumnBreak",
    )
    const columnSegments: Array<
        Array<{ atom: (typeof verse.nodes)[number]; i: number }>
    > = []
    if (hasTableColumns) {
        let currentSegment: Array<{
            atom: (typeof verse.nodes)[number]
            i: number
        }> = []
        verse.nodes.forEach((atom, i) => {
            if (atom.type === "tableColumnBreak") {
                if (currentSegment.length > 0) {
                    columnSegments.push(currentSegment)
                }
                currentSegment = []
            } else {
                currentSegment.push({ atom, i })
            }
        })
        if (currentSegment.length > 0) {
            columnSegments.push(currentSegment)
        }
    }

    return (
        <span
            data-testid={`readonly-verse-${verse.verse.verse}`}
            data-typed-in-history={isTypedInHistory ? "true" : "false"}
            className={clsx(
                "verse break-spaces group hover:cursor-pointer",
                hasTableColumns ? "block w-full" : "inline h-3 text-balance",
                isCurrentVerse && "active-verse",
                isTypedInHistory ? "text-primary/50" : "text-primary",
            )}
            ref={ref}
            onClick={() => {
                setCurrentVerse(verse.verse.value)
                setPosition([])
                setKeystrokes([])
            }}
        >
            {hasTableColumns ? (
                <span
                    className="inline-grid w-full gap-x-6"
                    style={{
                        gridTemplateColumns: `repeat(${columnSegments.length || 1}, minmax(0, 1fr))`,
                    }}
                >
                    {columnSegments.map((segment, segmentIndex) => (
                        <span key={segmentIndex} className="min-w-0">
                            {segment.map(({ atom, i }) => (
                                <Atom
                                    key={i}
                                    atom={atom}
                                    isIndented={isIndented}
                                />
                            ))}
                        </span>
                    ))}
                </span>
            ) : (
                verse.nodes.map((atom, aIndexPrime) => (
                    <Atom
                        key={aIndexPrime}
                        atom={atom}
                        isIndented={isIndented}
                    />
                ))
            )}

            {rect && passageRect ? (
                <button
                    data-testid={`focus-verse-button-${verse.verse.verse}`}
                    className={clsx(
                        "svg-outline border-primary bg-secondary/80 text-primary absolute z-10 border-2 opacity-0 backdrop-blur-xs transition-opacity duration-100",
                        !isPassageActive && "hover:opacity-100",
                        "focus:opacity-100",
                    )}
                    style={{
                        width: passageRect.width + 16,
                        height: rect.height + 16,
                        left: -8,
                        top: rect.top - passageRect.top - 8,
                    }}
                >
                    {currentVerse ? (
                        <span>Switch to verse {verse.verse.value}</span>
                    ) : (
                        <span>Start typing at verse {verse.verse.value}</span>
                    )}
                </button>
            ) : null}
        </span>
    )
}
