import React, { useContext, useRef } from 'react'
import {
    ArenaContext,
    currentVerseAtom,
    isArenaActiveAtom,
    keystrokesAtom,
    positionAtom,
} from '~/components/arena'
import { useRect } from '~/lib/hooks/useRect'
import { useAtom, useSetAtom } from 'jotai'
import clsx from 'clsx'
import { Word } from '~/components/word'
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
    const { rect: arenaRect } = useContext(ArenaContext)
    const [isArenaActive] = useAtom(isArenaActiveAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)
    // const arenaRect = useRect(arenaRef)
    const typingSession = api.typingSession.getOrCreateTypingSession.useQuery(
        undefined,
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

    const setCurrentVerse = useSetAtom(currentVerseAtom)
    const setPosition = useSetAtom(positionAtom)
    const setKeystrokes = useSetAtom(keystrokesAtom)

    return (
        <span
            className={clsx(
                'verse break-spaces text-balance group inline h-3 hover:cursor-pointer',
                isCurrentVerse && 'active-verse',
                isTypedInSession && 'text-gray-400',
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

            {rect && arenaRect ? (
                <button
                    className={clsx(
                        'svg-outline absolute z-10 border-2 border-black bg-white/80 opacity-0 backdrop-blur-sm transition-opacity duration-100',
                        !isArenaActive && 'hover:opacity-100',
                        'focus:opacity-100',
                    )}
                    style={{
                        width: arenaRect.width + 16,
                        height: rect.height + 16,
                        left: -8,
                        top: rect.top - arenaRect.top - 8,
                    }}
                >
                    <span>Switch to verse {verse.verse.value}</span>
                </button>
            ) : null}
        </span>
    )
}
