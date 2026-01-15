import clsx from 'clsx'
import { useAtom, useSetAtom } from 'jotai'
import React, { useRef } from 'react'

import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'
import {
    currentVerseAtom,
    isPassageActiveAtom,
    keystrokesAtom,
    positionAtom,
} from '~/components/passage'
import { usePassageRect, useVerseRect } from '~/lib/hooks/passageRectContext'
import { Verse } from '~/lib/parseEsv'

export function ReadonlyVerse({
    isCurrentVerse,
    isIndented,
    verse,
    chapterHistory,
}: {
    isCurrentVerse: boolean
    isIndented: boolean
    verse: Verse
    chapterHistory?: ChapterHistory
}) {
    const passageRect = usePassageRect()
    const [isPassageActive] = useAtom(isPassageActiveAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useVerseRect(ref, verse.verse.text + verse.metadata.offset)

    const isTypedInHistory = chapterHistory?.verses[verse.verse.verse]

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)
    const setPosition = useSetAtom(positionAtom)
    const setKeystrokes = useSetAtom(keystrokesAtom)

    return (
        <span
            className={clsx(
                'verse break-spaces group inline h-3 text-balance hover:cursor-pointer',
                isCurrentVerse && 'active-verse',
                isTypedInHistory ? 'text-primary/50' : 'text-primary',
            )}
            ref={ref}
            onClick={() => {
                setCurrentVerse(verse.verse.value)
                setPosition([])
                setKeystrokes([])
            }}
        >
            {verse.nodes.map((atom, aIndexPrime) => {
                if (atom.type === 'newLine') return <br key={aIndexPrime} />

                if (atom.type === 'verseNumber') {
                    return (
                        <b
                            className={clsx(isIndented && 'absolute -left-0')}
                            key={aIndexPrime}
                        >
                            {atom.text.split(':').at(-1)}
                        </b>
                    )
                }

                if (atom.type === 'space') {
                    return (
                        <span
                            key={aIndexPrime}
                            className={clsx(
                                'space inline-flex h-[19px] w-[1ch] translate-y-[3px]',
                            )}
                        >
                            &nbsp;
                        </span>
                    )
                }

                if (atom.type === 'decoration') {
                    return null
                }

                if (atom.type === 'word') {
                    const wordText = atom.letters
                        .join('')
                        .replace(' ', '\u00a0')

                    // For divine names, split first letter from rest for styling
                    if (atom.divineName && wordText.length > 1) {
                        const firstLetter = wordText[0]
                        const rest = wordText.slice(1)
                        return (
                            <span key={aIndexPrime} className="word">
                                <span>{firstLetter}</span>
                                <span className="divine-name">{rest}</span>
                                <span className="text-[0px]"> </span>
                            </span>
                        )
                    }

                    return (
                        <span key={aIndexPrime} className="word">
                            {wordText}
                            <span className="text-[0px]"> </span>
                        </span>
                    )
                }

                return null
            })}

            {rect && passageRect ? (
                <button
                    className={clsx(
                        'svg-outline absolute z-10 border-2 border-primary bg-secondary/80 text-primary opacity-0 backdrop-blur-sm transition-opacity duration-100',
                        !isPassageActive && 'hover:opacity-100',
                        'focus:opacity-100',
                    )}
                    style={{
                        width: passageRect.width + 16,
                        height: rect.height + 16,
                        left: -8,
                        top: rect.top - passageRect.top - 8,
                    }}
                >
                    {Boolean(currentVerse) ? (
                        <span>Switch to verse {verse.verse.value}</span>
                    ) : (
                        <span>Start typing at verse {verse.verse.value}</span>
                    )}
                </button>
            ) : null}
        </span>
    )
}
