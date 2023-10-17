import React, { useRef, useState } from 'react'

import { isAtomTyped, isVerseSameShape } from '~/lib/isEqual'
import { Atom, parseChapter } from '~/lib/parseEsv'
import { EsvPassageSchema } from '~/server/api/routers/passage'

import { Paragraph } from './paragraph'
import { useCursor } from '~/lib/hooks'
import { getPosition, isValidKeystroke, Keystroke } from '~/lib/keystroke'

export function Arena({ passage }: { passage: EsvPassageSchema }) {
    const chapter = parseChapter(passage?.passages.at(0) ?? '')

    console.log({ chapter })
    const inputRef = useRef<HTMLInputElement>(null)
    const [, setKeystrokes] = useState<Keystroke[]>([])
    const [position, setPosition] = useState<Atom[]>([] as Atom[])

    const [currentVerse, setCurrentVerse] = useState(
        chapter.flatMap(node => ('nodes' in node ? node.nodes : [])).at(0)
            ?.verse,
    )

    function handleInput(e: React.KeyboardEvent<HTMLInputElement>) {
        console.log(e.key)
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

                return next
            })
        }
    }

    useCursor()

    return (
        <div className="arena prose relative z-0">
            <input
                type="text"
                className="peer absolute h-0 max-h-0 opacity-0"
                tabIndex={0}
                id="myInput"
                onKeyDown={e => {
                    e.preventDefault()
                    handleInput(e)
                }}
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
            <div id="cursor" className="rounded-sm/10 absolute bg-black/20" />
        </div>
    )
}
