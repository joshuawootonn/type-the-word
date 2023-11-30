import { Block, Inline, ParsedPassage, Verse } from '~/lib/parseEsv'
import React, { useContext, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import {
    ArenaContext,
    autofocusAtom,
    currentVerseAtom,
    isArenaActiveAtom,
    isArenaFocusedAtom,
    keystrokesAtom,
    positionAtom,
} from '~/components/arena'
import { useSession } from 'next-auth/react'
import { api } from '~/utils/api'
import { getPosition, isAtomComplete, isValidKeystroke } from '~/lib/keystroke'
import { isAtomTyped, isVerseSameShape } from '~/lib/isEqual'
import clsx from 'clsx'
import { Word } from '~/components/word'
import { useRect } from '~/lib/hooks/useRect'

function getWords(verse: string, blocks: Block[]): Inline[] {
    return blocks.flatMap(block => {
        switch (block.type) {
            case 'paragraph':
                return getWords(verse, block.nodes)

            case 'verse':
                if (verse !== block.verse.value) return []

                return block.nodes.flatMap(node => {
                    if (node.type === 'paragraph')
                        return [...getWords(verse, node.nodes)]
                    else if (node.type === 'word') {
                        return [node]
                    } else {
                        return []
                    }
                })
            default:
                return []
        }
    })
}

function getListOfVerses(blocks: Block[]): Verse[] {
    return blocks.flatMap(block => {
        switch (block.type) {
            case 'paragraph':
                return getListOfVerses(block.nodes)
            case 'verse':
                return [block]
            default:
                return []
        }
    })
}

function getVerse(currentVerse: string, blocks: Block[]): Verse {
    const listOfVerses = getListOfVerses(blocks)
    const indexOfCurrent = listOfVerses.findIndex(
        verse => verse.verse.value === currentVerse,
    )

    const verse = listOfVerses.at(indexOfCurrent)

    if (verse == null) {
        throw new Error('ReadonlyVerse not found')
    }

    return verse
}

function getNextVerse(currentVerse: string, blocks: Block[]): Verse | null {
    const listOfVerses = getListOfVerses(blocks)
    const indexOfCurrent = listOfVerses.findIndex(
        verse => verse.verse.value === currentVerse,
    )

    const verse = listOfVerses
        .slice(indexOfCurrent)
        .find(verse => verse.verse.value !== currentVerse)

    return verse ?? null
}

export function CurrentVerse({
    verse,
    isCurrentVerse,
    isIndented,
    passage,
}: {
    isCurrentVerse: boolean
    isIndented: boolean
    verse: Verse
    passage: ParsedPassage
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [position, setPosition] = useAtom(positionAtom)
    const [keystrokes, setKeystrokes] = useAtom(keystrokesAtom)
    const [autoFocus] = useAtom(autofocusAtom)
    const { data: sessionData } = useSession()

    const typingSession = api.typingSession.getOrCreateTypingSession.useQuery(
        undefined,
        {
            enabled: sessionData?.user?.id != null,
        },
    )
    const addTypedVerseToSession =
        api.typingSession.addTypedVerseToSession.useMutation()

    const { rect: arenaRect } = useContext(ArenaContext)
    const [isArenaActive, setIsArenaActive] = useAtom(isArenaActiveAtom)
    const [isArenaFocused, setIsArenaFocused] = useAtom(isArenaFocusedAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)

    // This is necessary to autofocus on SSR
    useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus()
        }
    }, [])

    const isActiveTimer = useRef<NodeJS.Timer>()

    function handleInput(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
            }

            let isVerseComplete = false

            setIsArenaActive(true)
            const currentVerseNodes = getWords(currentVerse, passage.nodes)
            if (currentVerseNodes == null) {
                throw new Error('Current ReadonlyVerse is invalid.')
            }
            const next = isValidKeystroke(e.key, currentVerseNodes, keystrokes)

            if (next == null) return keystrokesAtom
            const position = getPosition(next)

            isVerseComplete = isVerseSameShape(
                currentVerseNodes?.filter(isAtomTyped) ?? [],
                position,
            )

            if (isVerseComplete) {
                const verse = getVerse(currentVerse, passage.nodes)
                const nextVerse = getNextVerse(currentVerse, passage.nodes)

                if (nextVerse?.verse.verse) {
                    setCurrentVerse(nextVerse?.verse.value)
                    setPosition([])
                    setKeystrokes([])
                } else {
                    setCurrentVerse('')
                    inputRef.current?.blur()
                    setPosition([])
                    setKeystrokes([])
                }

                if (
                    typingSession?.data?.id != null &&
                    sessionData?.user?.id != null
                ) {
                    void addTypedVerseToSession
                        .mutateAsync({
                            book: verse.verse.book,
                            chapter: verse.verse.chapter,
                            verse: verse.verse.verse,
                            translation: verse.verse.translation,
                            typingSessionId: typingSession.data.id,
                        })
                        .then(() => typingSession.refetch())
                }
            } else {
                setPosition(position)
                setKeystrokes(next)
            }

            clearTimeout(isActiveTimer.current)
            isActiveTimer.current = setTimeout(() => {
                setIsArenaActive(false)
            }, 3000)
        }
    }

    const versePosition = verse.metadata.hangingVerse
        ? position.slice(
              verse.metadata.offset,
              verse.metadata.offset + verse.metadata.length,
          )
        : position

    const isTypedInSession = typingSession.data?.typedVerses.find(
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
                inputRef.current?.focus()
            }}
        >
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
                                (aIndex === 0 || isAtomComplete(lastAtom)) &&
                                    !isAtomComplete(typedAtom) &&
                                    nextAtom == null,
                            )}
                            typedWord={typedAtom}
                            isPrevTyped={
                                (versePosition.length === 0 && aIndex === 0) ||
                                !!lastAtom
                            }
                            isWordTyped={isAtomComplete(typedAtom)}
                        />
                    )
                }

                return null
            })}

            {rect && arenaRect && !isArenaFocused ? (
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
                    onClick={() => {
                        setIsArenaFocused(true)
                    }}
                >
                    <span>Continue typing verse {verse.verse.value}</span>
                </button>
            ) : null}
            <input
                type="text"
                className="peer fixed h-0 max-h-0 opacity-0"
                onKeyDown={e => {
                    handleInput(e)
                }}
                tabIndex={-1}
                onFocus={() => setIsArenaFocused(true)}
                onBlur={() => setIsArenaFocused(false)}
                ref={inputRef}
                autoFocus={true}
            />
        </span>
    )
}
