import React, { useContext, useRef } from 'react'
import {
    PassageContext,
    currentVerseAtom,
    isPassageActiveAtom,
    keystrokesAtom,
    positionAtom,
} from '~/components/passage'
import { useRect } from '~/lib/hooks/useRect'
import { useAtom, useSetAtom } from 'jotai'
import clsx from 'clsx'
import { Verse } from '~/lib/parseEsv'
import { TypingSession } from '~/server/repositories/typingSession.repository'
import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'

export function ReadonlyVerse({
    isCurrentVerse,
    isIndented,
    isQuote,
    verse,
    typingSession,
    chapterHistory,
}: {
    isCurrentVerse: boolean
    isIndented: boolean
    isQuote: boolean
    verse: Verse
    typingSession?: TypingSession
    chapterHistory?: ChapterHistory
}) {
    const { rect: passageRect } = useContext(PassageContext)
    const [isPassageActive] = useAtom(isPassageActiveAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)

    const isTypedInSession = typingSession?.typedVerses.find(
        a =>
            a.verse === verse.verse.verse &&
            a.chapter === verse.verse.chapter &&
            a.book === verse.verse.book &&
            a.translation === verse.verse.translation,
    )

    const isTypedInHistory = chapterHistory?.verses[verse.verse.verse]

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)
    const setPosition = useSetAtom(positionAtom)
    const setKeystrokes = useSetAtom(keystrokesAtom)

    return (
        <span
            className={clsx(
                'verse break-spaces group inline h-3 text-balance hover:cursor-pointer',
                isCurrentVerse && 'active-verse',
                isTypedInSession ?? isTypedInHistory
                    ? 'text-primary/50'
                    : 'text-primary',
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

                if (atom.type === 'word') {
                    return (
                        <span key={aIndexPrime} className="word">
                            {atom.letters.join('').replace(' ', '\u00a0')}
                            <span className="text-[0px]"> </span>
                        </span>
                    )
                }

                return null
            })}

            {isTypedInSession && rect && passageRect ? (
                <svg
                    className={
                        'absolute -left-3 right-full z-0 w-4 rounded-none md:-left-6'
                    }
                    style={
                        isQuote
                            ? {
                                  height: rect.height + 48,
                                  top: rect.top - passageRect.top - 24,
                              }
                            : {
                                  height: rect.height + 20,
                                  top: rect.top - passageRect.top - 10,
                              }
                    }
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line
                        className={'stroke-primary'}
                        strokeWidth={'2'}
                        strokeLinejoin={'round'}
                        strokeLinecap={'round'}
                        x1="5px"
                        y1="0%"
                        x2="5px"
                        y2="100%"
                    />
                </svg>
            ) : null}

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
