import React, { useEffect, useId, useRef, useState } from 'react'

import { isAtomTyped, isVerseSameShape } from '~/lib/isEqual'
import { Atom, parseChapter } from '~/lib/parseEsv'
import { EsvPassageSchema } from '~/server/api/routers/passage'

import { Paragraph } from './paragraph'
import { getPosition, isValidKeystroke, Keystroke } from '~/lib/keystroke'
import { Cursor } from '~/components/cursor'

export function Arena({ passage }: { passage: EsvPassageSchema }) {
    const arenaId = useId()
    const chapter = parseChapter(passage?.passages.at(0) ?? '')

    console.log({ chapter })
    const inputRef = useRef<HTMLInputElement>(null)
    const [, setKeystrokes] = useState<Keystroke[]>([])
    const [position, setPosition] = useState<Atom[]>([] as Atom[])

    const [currentVerse, setCurrentVerse] = useState(
        chapter.flatMap(node => ('nodes' in node ? node.nodes : [])).at(0)
            ?.verse,
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
                const currentVerseNode = chapter
                    .flatMap(node => ('nodes' in node ? node.nodes : []))
                    .find(verse => verse.verse === currentVerse)
                if (currentVerseNode == null) {
                    throw new Error('Current Verse is invalid.')
                }
                const next = isValidKeystroke(e.key, currentVerseNode, prev)

                if (next == null) return prev
                const position = getPosition(next)

                const isVerseComplete = isVerseSameShape(
                    currentVerseNode?.nodes.filter(isAtomTyped) ?? [],
                    position,
                )

                isVerseComplete && console.log('verse complete')

                if (isVerseComplete) {
                    const verses = chapter.flatMap(node =>
                        'nodes' in node ? node.nodes : [],
                    )
                    const currentVerseIndex = verses.findIndex(
                        verse => verse.verse === currentVerse,
                    )
                    const next = verses.at(currentVerseIndex + 1)

                    setCurrentVerse(next?.verse ?? '')
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
            {chapter.map((node, pIndex) => {
                switch (node.type) {
                    case 'paragraph':
                        return (
                            <Paragraph
                                key={pIndex}
                                node={node}
                                currentVerse={currentVerse}
                                setCurrentVerse={(verse: string) => {
                                    setCurrentVerse(verse)
                                    setPosition([])
                                    setKeystrokes([])
                                    setIsArenaActive(true)
                                    inputRef.current?.focus()
                                }}
                                position={position}
                            />
                        )

                    case 'footnote':
                        return null
                    case 'newLine':
                        return <br key={pIndex} className="mb-2" />
                    case 'title':
                        if (node.text === 'Footnotes') return null

                        return (
                            <h2 key={pIndex} className="tracking-tight">
                                {node.text}
                            </h2>
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
