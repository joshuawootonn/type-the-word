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
import { api } from '~/utils/api'
import { useSession } from 'next-auth/react'

export function ReadonlyVerse({
    isCurrentVerse,
    isIndented,
    verse,
}: {
    isCurrentVerse: boolean
    isIndented: boolean
    verse: Verse
}) {
    const { data: sessionData } = useSession()
    const { rect: passageRect } = useContext(PassageContext)
    const [isPassageActive] = useAtom(isPassageActiveAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)
    // const passageRect = useRect(passageRef)
    const typingSession = api.typingSession.getOrCreateTypingSession.useQuery(
        undefined,
        {
            enabled: sessionData?.user?.id != null,
        },
    )
    const chapterHistory = api.chapterHistory.getChapterHistory.useQuery(
        { chapter: verse.verse.chapter, book: verse.verse.book },
        {
            enabled: sessionData?.user?.id != null,
        },
    )

    const isTypedInSession = typingSession.data?.typedVerses.find(
        a =>
            a.verse === verse.verse.verse &&
            a.chapter === verse.verse.chapter &&
            a.book === verse.verse.book &&
            a.translation === verse.verse.translation,
    )

    const isTypedInHistory = chapterHistory.data?.verses[verse.verse.verse]

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)
    const setPosition = useSetAtom(positionAtom)
    const setKeystrokes = useSetAtom(keystrokesAtom)

    return (
        <span
            className={clsx(
                'verse break-spaces text-balance group inline h-3 hover:cursor-pointer',
                isCurrentVerse && 'active-verse',
                isTypedInSession ?? isTypedInHistory
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-black dark:text-white',
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
                    style={{
                        height: rect.height + 16,
                        top: rect.top - passageRect.top - 8,
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line
                        className={'stroke-black dark:stroke-white'}
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
                        'svg-outline absolute z-10 border-2 border-black bg-white/80 text-black opacity-0 backdrop-blur-sm transition-opacity duration-100 dark:border-white dark:bg-black/80 dark:text-white',
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
