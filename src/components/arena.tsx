/* eslint-disable @typescript-eslint/ban-ts-comment */
import equal from 'fast-deep-equal'
import { useRef, useState, useEffect } from 'react'

import { isAtomEqual, isAtomTyped, isVerseEqual } from '~/lib/isEqual'
import { Atom, parseChapter } from '~/lib/parseEsv'
import { EsvPassageSchema } from '~/server/api/routers/passage'

import { Paragraph } from './paragraph'

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

                const correctAtomNodes = currentVerseNode.nodes.filter(isAtomTyped)

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

    const [animatedCursorRect, setAnimatedCursorRect] = useState<{
        top: string | number
        left: string | number
        width: string | number
        height: string | number
    }>({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    })

    useEffect(() => {
        function move() {
            const arena = document.querySelector('.arena')
            const arenaRect = arena?.getBoundingClientRect()
            if (arenaRect == null) return

            const activeLetterRect = document
                .querySelector(
                    '.active-verse .active-word span:not(.correct):not(.incorrect):not(.extra)',
                )
                ?.getBoundingClientRect()

            if (activeLetterRect) {
                setAnimatedCursorRect(prev => {
                    const next = {
                        ...activeLetterRect,
                        top: `${activeLetterRect.top - arenaRect.top}px`,
                        left: `${activeLetterRect.left - arenaRect.left}px`,
                        width: `${activeLetterRect.width}px`,
                        height: '19px',
                    }

                    return equal(prev, next) ? prev : next
                })
                return
            }
            const activeSpaceRect = document
                .querySelector('.active-verse .active-space')
                ?.getBoundingClientRect()

            if (activeSpaceRect) {
                setAnimatedCursorRect(prev => {
                    const next = {
                        ...activeSpaceRect,
                        top: `${activeSpaceRect.top - arenaRect.top + 2}px`,
                        left: `${activeSpaceRect.left - arenaRect.left}px`,
                        width: `${activeSpaceRect.width}px`,
                        height: '19px',
                    }

                    return equal(prev, next) ? prev : next
                })
                return
            }
        }

        if (process.env.NODE_ENV === 'production') {
            let frame = requestAnimationFrame(function loop() {
                frame = requestAnimationFrame(loop)
                move()
            })

            return () => {
                cancelAnimationFrame(frame)
            }
        }

        let now = Date.now()
        let then = now
        const fpsInterval = 1000 / 60

        let frame = requestAnimationFrame(function loop() {
            frame = requestAnimationFrame(loop)

            now = Date.now()
            const elapsed = now - then

            if (elapsed > fpsInterval) {
                then = now - (elapsed % fpsInterval)

                move()
            }
        })

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [])

    return (
        <div className="arena relative z-0  p-2  ">
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
            <div
                className="absolute rounded-sm bg-black/10 peer-focus:bg-black/20"
                style={{
                    top: animatedCursorRect.top,
                    left: animatedCursorRect?.left,
                    width: animatedCursorRect?.width,
                    height: animatedCursorRect?.height,
                    color: 'lime',
                }}
            />
        </div>
    )
}
