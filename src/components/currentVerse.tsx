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
    const chapterHistory = api.chapterHistory.getChapterHistory.useQuery(
        { chapter: verse.verse.chapter, book: verse.verse.book },
        {
            enabled: sessionData?.user?.id != null,
        },
    )

    const utils = api.useContext()
    const addTypedVerseToSession =
        api.typingSession.addTypedVerseToSession.useMutation({
            async onMutate(newPost) {
                // Cancel outgoing fetches (so they don't overwrite our optimistic update)
                // await utils.type.list.cancel();
                await utils.typingSession.getOrCreateTypingSession.cancel()

                // Get the data from the queryCache
                const prevData =
                    utils.typingSession.getOrCreateTypingSession.getData()

                // Optimistically update the data with our new post
                utils.typingSession.getOrCreateTypingSession.setData(
                    undefined,
                    old => {
                        if (old == null) {
                            return undefined
                        }

                        return {
                            ...old,
                            typedVerses: [
                                ...old.typedVerses,
                                {
                                    ...newPost,
                                    id: crypto.randomUUID(),
                                    userId: crypto.randomUUID(),
                                    createdAt: new Date(),
                                },
                            ],
                        }
                    },
                )

                // Return the previous data so we can revert if something goes wrong
                return { prevData }
            },
            onError(err, newPost, ctx) {
                // If the mutation fails, use the context-value from onMutate
                utils.typingSession.getOrCreateTypingSession.setData(
                    undefined,
                    ctx?.prevData,
                )
            },
            onSettled() {
                // Sync with server once mutation has settled
                void utils.typingSession.getOrCreateTypingSession.invalidate()
            },
        })

    const { rect: arenaRect } = useContext(ArenaContext)
    const [isArenaActive, setIsArenaActive] = useAtom(isArenaActiveAtom)
    const [isArenaFocused, setIsArenaFocused] = useAtom(isArenaFocusedAtom)

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)

    // This is necessary to autofocus on SSR
    useEffect(() => {
        if (autoFocus) {
            // This redundant call is so because the `input.onFocus`  wasn't firing
            // for chrome hard reload, and ff soft/hard reload.
            setIsArenaFocused(true)
            return inputRef.current?.focus()
        }
    }, [])

    const isActiveTimer = useRef<NodeJS.Timer>()

    useEffect(() => {
        clearTimeout(isActiveTimer.current)

        isActiveTimer.current = setTimeout(() => {
            setIsArenaActive(false)
        }, 3000)

        return () => clearTimeout(isActiveTimer.current)
    }, [keystrokes.length])

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

    const isTypedInHistory = chapterHistory.data?.verses[verse.verse.verse]

    return (
        <span
            className={clsx(
                'verse break-spaces text-balance group inline h-3 hover:cursor-pointer',
                isCurrentVerse && 'active-verse',
                isTypedInSession ?? isTypedInHistory
                    ? 'text-slate-500'
                    : 'text-black',
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

            {isTypedInSession && rect && arenaRect ? (
                <svg
                    className={
                        'absolute -left-8 bottom-0 right-full top-0 z-0 w-1 rounded-none'
                    }
                    style={{
                        height: rect.height + 16,
                        left: -20,
                        top: rect.top - arenaRect.top - 8,
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line
                        stroke={'black'}
                        strokeWidth={6}
                        strokeDasharray={'6 5'}
                        x1="0px"
                        y1="0px"
                        x2="0px"
                        y2="100%"
                    />
                </svg>
            ) : null}

            {rect && arenaRect && !isArenaFocused ? (
                <button
                    className={clsx(
                        'svg-outline absolute z-10 border-2 border-black bg-white/80 text-black opacity-0 backdrop-blur-sm transition-opacity duration-100',
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
                onKeyDown={e => handleInput(e)}
                tabIndex={-1}
                onFocus={() => {
                    setIsArenaFocused(true)
                }}
                onBlur={() => {
                    setIsArenaFocused(false)
                }}
                ref={inputRef}
                autoFocus={true}
            />
        </span>
    )
}
