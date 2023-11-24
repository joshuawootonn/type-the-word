import clsx from 'clsx'
import { isAtomTyped } from '~/lib/isEqual'
import { Word } from './word'
import { Inline, Paragraph, Verse } from '~/lib/parseEsv'
import { isAtomComplete } from '~/lib/keystroke'
import { ReactNode, useContext, useRef, useState } from 'react'
import { ArenaContext } from '~/components/arena'
import { useRect } from '~/lib/hooks/useRect'

export function Paragraph({
    position,
    node,
    currentVerse,
    setCurrentVerse,
    currentVerseInput,
}: {
    position: Inline[]
    node: Paragraph
    currentVerse?: string
    setCurrentVerse: (verse: string) => void
    currentVerseInput?: ReactNode
}) {
    return (
        <p className={clsx('text-lg', node.metadata.blockIndent && 'ml-3')}>
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse
                const versePosition = verse.metadata.hangingVerse
                    ? position.slice(
                          verse.metadata.offset,
                          verse.metadata.offset + verse.metadata.length,
                      )
                    : position

                return (
                    <Verse
                        key={vIndex}
                        verse={verse}
                        versePosition={versePosition}
                        isCurrentVerse={isCurrentVerse}
                        setCurrentVerse={setCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                        currentVerseInput={currentVerseInput}
                    />
                )
            })}
        </p>
    )
}

export function Verse({
    verse,
    isCurrentVerse,
    setCurrentVerse,
    versePosition,
    isIndented,
    currentVerseInput,
}: {
    versePosition: Inline[]
    setCurrentVerse: (verse: string) => void
    isCurrentVerse: boolean
    isIndented: boolean
    verse: Verse
    currentVerseInput?: ReactNode
}) {
    const {
        rect: arenaRect,
        typingSession,
        isArenaActive,
    } = useContext(ArenaContext)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)

    const isTypedInSession = typingSession?.typedVerses.find(
        a =>
            a.verse === verse.verse.verse &&
            a.chapter === verse.verse.chapter &&
            a.book === verse.verse.book &&
            a.translation === verse.verse.translation,
    )

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
            }}
        >
            {isCurrentVerse ? (
                <>
                    {verse.nodes.map((atom, aIndexPrime) => {
                        const aIndex = verse.nodes
                            .slice(0, aIndexPrime)
                            .filter(isAtomTyped).length

                        const lastAtom = versePosition.at(aIndex - 1)
                        const typedAtom = versePosition.at(aIndex)
                        const nextAtom = versePosition.at(aIndex + 1)

                        if (atom.type === 'newLine') {
                            return <br key={aIndexPrime} />
                        }

                        if (atom.type === 'verseNumber') {
                            return (
                                <b
                                    className={clsx(
                                        isIndented && 'absolute -left-0',
                                    )}
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
                                        lastAtom != null &&
                                            typedAtom == null &&
                                            'active-space',
                                    )}
                                >
                                    &nbsp;
                                </span>
                            )
                        }
                        if (
                            atom.type === 'word' &&
                            (typedAtom == null || typedAtom.type === 'word')
                        ) {
                            return (
                                <Word
                                    key={aIndexPrime}
                                    word={atom}
                                    active={Boolean(
                                        (aIndex === 0 ||
                                            isAtomComplete(lastAtom)) &&
                                            !isAtomComplete(typedAtom) &&
                                            nextAtom == null,
                                    )}
                                    typedWord={typedAtom}
                                    isPrevTyped={
                                        (versePosition.length === 0 &&
                                            aIndex === 0) ||
                                        !!lastAtom
                                    }
                                    isWordTyped={isAtomComplete(typedAtom)}
                                />
                            )
                        }

                        return null
                    })}

                    {currentVerseInput}
                </>
            ) : (
                <>
                    {verse.nodes.map((atom, aIndexPrime) => {
                        if (atom.type === 'newLine')
                            return <br key={aIndexPrime} />

                        if (atom.type === 'verseNumber') {
                            return (
                                <b
                                    className={clsx(
                                        isIndented && 'absolute -left-0',
                                    )}
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
                                <Word
                                    key={aIndexPrime}
                                    word={atom}
                                    active={false}
                                    isPrevTyped={false}
                                    isWordTyped={false}
                                />
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
                </>
            )}
        </span>
    )
}
