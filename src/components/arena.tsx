import React, { useEffect, useId, useRef, useState } from 'react'

import { isAtomTyped, isVerseSameShape } from '~/lib/isEqual'
import { Block, Inline, ParsedPassage, Verse } from '~/lib/parseEsv'

import { Paragraph } from './paragraph'
import { getPosition, isValidKeystroke, Keystroke } from '~/lib/keystroke'
import { Cursor } from '~/components/cursor'

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

export function Arena({ passage }: { passage: ParsedPassage }) {
    const arenaId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [, setKeystrokes] = useState<Keystroke[]>([])
    const [position, setPosition] = useState<Inline[]>([] as Inline[])

    const [currentVerse, setCurrentVerse] = useState<string>(
        passage.firstVerse.value,
    )

    const [isArenaActive, setIsArenaActive] = useState(false)
    const [isArenaFocused, setIsArenaFocused] = useState(false)

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
            setKeystrokes(prev => {
                const currentVerseNodes = getWords(currentVerse, passage.nodes)
                if (currentVerseNodes == null) {
                    throw new Error('Current Verse is invalid.')
                }
                const next = isValidKeystroke(e.key, currentVerseNodes, prev)

                if (next == null) return prev
                const position = getPosition(next)

                const isVerseComplete = isVerseSameShape(
                    currentVerseNodes?.filter(isAtomTyped) ?? [],
                    position,
                )

                isVerseComplete && console.log('verse complete')

                if (isVerseComplete) {
                    const nextVerse = getNextVerse(currentVerse, passage.nodes)
                    setCurrentVerse(nextVerse?.verse.value ?? '')
                    setPosition([])
                    return []
                }

                setPosition(position)
                setIsArenaActive(true)

                return next
            })
        }
    }

    return (
        <div id={arenaId} className="arena prose relative z-0">
            <input
                type="text"
                className="peer fixed h-0 max-h-0 opacity-0"
                tabIndex={0}
                onKeyDown={e => {
                    e.preventDefault()
                    handleInput(e)
                }}
                onFocus={() => setIsArenaFocused(true)}
                onBlur={() => setIsArenaFocused(false)}
                ref={inputRef}
            />
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
                                    inputRef.current?.focus()
                                }}
                                position={
                                    node.verseMetadata?.offset != null &&
                                    node.verseMetadata?.length != null
                                        ? position.slice(
                                              node.verseMetadata.offset,
                                              node.verseMetadata.offset +
                                                  node.verseMetadata.length,
                                          )
                                        : position
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
            <Cursor
                arenaId={arenaId}
                isArenaFocused={isArenaFocused}
                isArenaActive={isArenaActive}
            />
        </div>
    )
}
