import { useRef, useState } from 'react'

import { isAtomEqual, isAtomTyped, isVerseEqual } from '~/lib/isEqual'
import { Atom, parseChapter } from '~/lib/parseEsv'
import { EsvPassageSchema } from '~/server/api/routers/passage'

import { Paragraph } from './paragraph'
import { useCursor } from '~/lib/hooks'

type Keystroke = { type: 'backspace' | 'insert'; key: string }

function getPosition(keystrokes: Keystroke[] = []): Atom[] {
    return keystrokes.reduce((acc, keystroke) => {
        const last = acc.at(-1)
        if (keystroke.type === 'insert' && keystroke.key === 'Enter') {
            return [...acc, { type: 'newLine' as const, typed: true }]
        } else if (keystroke.type === 'insert' && keystroke.key === ' ') {
            return [...acc, { type: 'space' as const, typed: true }]
        } else if (keystroke.type === 'insert' && keystroke.key) {
            if (last && last.type === 'word') {
                return [
                    ...acc.slice(0, -1),
                    { ...last, letters: [...last.letters, keystroke.key] },
                ]
            }
            return [...acc, { type: 'word', letters: [keystroke.key] }]
        } else if (keystroke.type === 'backspace') {
            if (last?.type === 'word' && last.letters.length > 1) {
                return [
                    ...acc.slice(0, -1),
                    { ...last, letters: last.letters.slice(0, -1) },
                ]
            }

            return acc.slice(0, -1)
        }
        return [...acc]
    }, [] as Atom[])
}

export function Arena({ passage }: { passage: EsvPassageSchema }) {
    const chapter = parseChapter(passage?.passages.at(0) ?? '')

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

                const correctAtomNodes =
                    currentVerseNode.nodes.filter(isAtomTyped)

                const prevPosition = getPosition(prev)
                const prevCurrentCorrect = correctAtomNodes.at(
                    prevPosition.length - 1,
                )
                const prevNextCorrect = correctAtomNodes.at(prevPosition.length)
                const isPrevCorrect = isAtomEqual(
                    prevPosition.at(-2),
                    correctAtomNodes.at(prevPosition.length - 2),
                )

                if (
                    (e.key === 'Backspace' && prevPosition.length === 0) ||
                    (e.key === 'Backspace' &&
                        (prevCurrentCorrect?.type === 'space' ||
                            prevCurrentCorrect?.type === 'newLine') &&
                        prevNextCorrect?.type === 'word' &&
                        isPrevCorrect)
                )
                    return prev

                if (
                    (e.key === ' ' || e.key === 'Enter') &&
                    (prevCurrentCorrect?.type === 'space' ||
                        prevCurrentCorrect?.type === 'newLine') &&
                    prevNextCorrect?.type === 'word'
                )
                    return prev

                const next = prev.concat({
                    type: e.key === 'Backspace' ? 'backspace' : 'insert',
                    key: e.key,
                })
                const position = getPosition(next)

                const lastAtom = position.at(-1)

                const currentCorrect = correctAtomNodes.at(position.length - 1)

                /**
                 * If you are supposed to type a space don't allow a new line etc.
                 */
                if (
                    (currentCorrect?.type === 'space' &&
                        lastAtom?.type === 'newLine') ||
                    (currentCorrect?.type === 'newLine' &&
                        lastAtom?.type === 'space')
                ) {
                    return prev
                }

                const isVerseComplete = isVerseEqual(
                    currentVerseNode?.nodes ?? [],
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
                                    inputRef.current?.focus()
                                    setCurrentVerse(verse)
                                    setPosition([])
                                    setKeystrokes([])
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
