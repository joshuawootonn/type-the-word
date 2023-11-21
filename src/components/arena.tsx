import React, { useEffect, useId, useRef, useState } from 'react'

import { isAtomTyped, isVerseSameShape } from '~/lib/isEqual'
import { Block, Inline, ParsedPassage, Verse } from '~/lib/parseEsv'

import { Paragraph } from './paragraph'
import { getPosition, isValidKeystroke, Keystroke } from '~/lib/keystroke'
import { Cursor } from '~/components/cursor'
import { api } from '~/utils/api'
import { useSession } from 'next-auth/react'

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

function getNextVerse(currentVerse: string, blocks: Block[]): Verse | null {
    const listOfVerses = getListOfVerses(blocks)
    const indexOfCurrent = listOfVerses.findIndex(
        verse => verse.verse.value === currentVerse,
    )

    return (
        listOfVerses
            .slice(indexOfCurrent)
            .find(verse => verse.verse.value !== currentVerse) ?? null
    )
}

export const ArenaContext = React.createContext<{ rect: DOMRect | null }>({
    rect: null,
})

export function Arena({
    passage,
    autofocus,
}: {
    passage: ParsedPassage
    autofocus: boolean
}) {
    const arenaId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [keystrokes, setKeystrokes] = useState<Keystroke[]>([])
    const [position, setPosition] = useState<Inline[]>([] as Inline[])
    const { data: sessionData } = useSession()

    const typingSession = api.passage.getTypingSession.useQuery(undefined, {
        enabled: sessionData?.user?.id != null,
    })
    const addTypedVerseToSession =
        api.passage.addTypedVerseToSession.useMutation()

    const [currentVerse, setCurrentVerse] = useState<string>(
        passage.firstVerse.value,
    )

    const arenaRef = useRef<HTMLDivElement>(null)
    const [arenaRect, setArenaRect] = useState<DOMRect | null>(null)
    const [isArenaActive, setIsArenaActive] = useState(false)
    const [isArenaFocused, setIsArenaFocused] = useState(false)

    // This is necessary to autofocus on SSR
    useEffect(() => {
        if (autofocus) {
            inputRef.current?.focus()
        }
    }, [])

    useEffect(() => {
        window.addEventListener('resize', updateRect)
        updateRect()

        return () => window.removeEventListener('resize', updateRect)

        function updateRect() {
            const nextRect = arenaRef.current?.getBoundingClientRect() ?? null
            if (
                nextRect &&
                (nextRect.top !== arenaRect?.top ||
                    nextRect.height !== arenaRect?.height ||
                    nextRect.width !== arenaRect?.width ||
                    nextRect.left !== arenaRect?.left)
            ) {
                setArenaRect(nextRect)
            }
        }
    }, [])

    useEffect(() => {
        const t = setTimeout(() => {
            setIsArenaActive(false)
        }, 3000)

        return () => {
            clearTimeout(t)
        }
    }, [isArenaActive])

    function handleInput(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
            let isVerseComplete = false

            setIsArenaActive(true)
            const currentVerseNodes = getWords(currentVerse, passage.nodes)
            if (currentVerseNodes == null) {
                throw new Error('Current Verse is invalid.')
            }
            const next = isValidKeystroke(e.key, currentVerseNodes, keystrokes)

            if (next == null) return keystrokes
            const position = getPosition(next)

            isVerseComplete = isVerseSameShape(
                currentVerseNodes?.filter(isAtomTyped) ?? [],
                position,
            )

            if (isVerseComplete) {
                const nextVerse = getNextVerse(currentVerse, passage.nodes)
                setCurrentVerse(nextVerse?.verse.value ?? '')
                setPosition([])
                setKeystrokes([])
                if (
                    typingSession?.data?.id != null &&
                    sessionData?.user?.id != null
                ) {
                    addTypedVerseToSession.mutate({
                        book: 'psalms',
                        chapter: 23,
                        verse: parseInt(currentVerse.split(':').at(-1) ?? ''),
                        translation: 'ESV',
                        typingSessionId: typingSession.data.id,
                    })

                    void typingSession.refetch()
                }
            } else {
                setPosition(position)
                setKeystrokes(next)
            }
        }
    }

    return (
        <div
            ref={arenaRef}
            id={arenaId}
            className="arena prose relative z-0 w-full"
        >
            <ArenaContext.Provider
                value={{
                    rect: arenaRect,
                }}
            >
                {passage.nodes.map((node, pIndex) => {
                    switch (node.type) {
                        case 'paragraph':
                            return (
                                <Paragraph
                                    key={pIndex}
                                    node={node}
                                    currentVerse={currentVerse}
                                    setCurrentVerse={(verse: string) => {
                                        if (verse !== currentVerse) {
                                            setCurrentVerse(verse)
                                            setPosition([])
                                            setKeystrokes([])
                                            setIsArenaActive(true)
                                        }
                                    }}
                                    position={position}
                                    currentVerseInput={
                                        <input
                                            type="text"
                                            className="peer fixed h-0 max-h-0 opacity-0"
                                            onKeyDown={e => {
                                                handleInput(e)
                                            }}
                                            onFocus={() => {
                                                setIsArenaFocused(true)
                                            }}
                                            onBlur={() =>
                                                setIsArenaFocused(false)
                                            }
                                            ref={inputRef}
                                            autoFocus={autofocus}
                                        />
                                    }
                                />
                            )

                        case 'h2':
                            return (
                                <h2 key={pIndex} className="tracking-tight">
                                    {node.text}
                                </h2>
                            )
                        case 'h3':
                            return (
                                <h3 key={pIndex} className="tracking-tight">
                                    {node.text}
                                </h3>
                            )
                        case 'h4':
                            return (
                                <h4 key={pIndex} className="tracking-tight">
                                    {node.text}
                                </h4>
                            )

                        default:
                            break
                    }
                })}
            </ArenaContext.Provider>
            <Cursor
                arenaId={arenaId}
                isArenaFocused={isArenaFocused}
                isArenaActive={isArenaActive}
            />
        </div>
    )
}
