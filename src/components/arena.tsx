/* eslint-disable @typescript-eslint/ban-ts-comment */
import clsx from 'clsx'
import { useRef, useState, useEffect } from 'react'

import { isVerseEqual } from '~/lib/isEqual'
import { Atom, parseChapter } from '~/lib/parseEsv'
import { EsvPassageSchema } from '~/server/api/routers/passage'

import { AtomComponent } from './atom'

function getPosition(
    keystrokes: { inputType: string; data: string }[] = [],
): Atom[] {
    return keystrokes.reduce((acc, keystroke) => {
        const last = acc.at(-1)
        if (keystroke.inputType === 'insertText' && keystroke.data === ' ') {
            return [...acc, { type: 'space' }]
        } else if (keystroke.inputType === 'insertText' && keystroke.data) {
            if (last && last.type === 'word') {
                return [
                    ...acc.slice(0, -1),
                    { ...last, letters: [...last.letters, keystroke.data] },
                ]
            }
            return [
                ...acc.slice(0, -1),
                { type: 'word', letters: [keystroke.data] },
            ]
        } else if (keystroke.inputType === 'deleteContentBackward') {
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
    // console.log({ chapter })

    const inputRef = useRef<HTMLInputElement>(null)
    const [keystrokes, setKeystrokes] = useState<
        { inputType: string; data: string }[]
    >([])
    const [position, setPosition] = useState<Atom[]>([] as Atom[])

    const [currentVersePosition, setCurrentVersePosition] = useState(
        chapter.flatMap(node => ('nodes' in node ? node.nodes : [])).at(0)
            ?.verse,
    )

    function handleInput(e: React.FormEvent<HTMLInputElement>) {
        if (
            //@ts-ignore
            e.nativeEvent.inputType === 'insertText' ||
            //@ts-ignore
            e.nativeEvent.inputType === 'deleteContentBackward'
        ) {
            // console.log(e.nativeEvent.inputType, e.nativeEvent.data)

            setKeystrokes(prev => {
                //@ts-ignore
                const next = prev.concat({
                    //@ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    inputType: e.nativeEvent.inputType,
                    //@ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    data: e.nativeEvent.data,
                })

                const position = getPosition(next)

                const currentVerse = chapter
                    .flatMap(node => ('nodes' in node ? node.nodes : []))
                    .find(verse => verse.verse === currentVersePosition)
                if (currentVerse == null) return next

                const isVerseComplete = isVerseEqual(
                    currentVerse?.nodes ?? [],
                    position,
                )

                if (isVerseComplete) {
                    const verses = chapter.flatMap(node =>
                        'nodes' in node ? node.nodes : [],
                    )
                    const currentVerseIndex = verses.findIndex(
                        verse => verse.verse === currentVersePosition,
                    )
                    const next = verses.at(currentVerseIndex + 1)

                    setCurrentVersePosition(next?.verse ?? '')
                    setPosition([])
                    return []
                }

                setPosition(position)
                console.log({
                    isVerseComplete,
                    currentVerse,
                    position,
                    keystrokes,
                })

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
                    '.active-verse .active span:not(.correct):not(.incorrect):not(.extra)',
                )
                ?.getBoundingClientRect()

            if (activeLetterRect) {
                setAnimatedCursorRect({
                    ...activeLetterRect,
                    top: activeLetterRect.top - arenaRect.top,
                    left: activeLetterRect.left - arenaRect.left,
                    width: activeLetterRect.width,
                    height: activeLetterRect.height,
                })
                return
            }
            const activeSpaceRect = document
                .querySelector('.active-verse .active ~ .space')
                ?.getBoundingClientRect()

            if (activeSpaceRect) {
                setAnimatedCursorRect({
                    ...activeSpaceRect,
                    top: activeSpaceRect.top - arenaRect.top,
                    left: activeSpaceRect.left - arenaRect.left,
                    width: activeSpaceRect.width,
                    height: '100%',
                })
                return
            }
        }

        let frame = requestAnimationFrame(function loop() {
            frame = requestAnimationFrame(loop)
            move()
        })

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [])

    return (
        <>
            <input
                type="text"
                className="absolute h-0 max-h-0 peer opacity-0"
                tabIndex={0}
                id="myInput"
                onInput={e => {
                    e.preventDefault()
                    handleInput(e)
                }}
                ref={inputRef}
            />
            {chapter.map((node, pIndex) => {
                switch (node.type) {
                    case 'paragraph':
                        return (
                            <p className="font-[0px]" key={pIndex}>
                                {node.nodes.map((verse, vIndex) => {
                                    const isCurrentVerse =
                                        currentVersePosition === verse.verse

                                    return (
                                        <span
                                            key={vIndex}
                                            className={clsx(
                                                'verse inline break-spaces text-balance h-3',
                                                isCurrentVerse &&
                                                    'active-verse bg-gray-100',
                                            )}
                                            onClick={() => {
                                                console.log('click')

                                                inputRef.current?.focus()
                                            }}
                                        >
                                            <b>{verse.verse}</b>
                                            {verse.nodes.map((atom, aIndex) => {
                                                const typedAtom =
                                                    position.at(aIndex)

                                                const isAtomTyped = position.at(
                                                    aIndex + 1,
                                                )

                                                return (
                                                    <AtomComponent
                                                        key={aIndex}
                                                        atom={atom}
                                                        typedAtom={typedAtom}
                                                        isAtomTyped={
                                                            !!isAtomTyped
                                                        }
                                                    />
                                                )
                                            })}
                                        </span>
                                    )
                                })}
                            </p>
                        )
                    case 'footnote':
                        return (
                            <p key={pIndex} className="my-2">
                                <b>{node.verse}</b>
                                {node.text}
                            </p>
                        )
                    case 'newLine':
                        return <br key={pIndex} className="mb-2" />
                    case 'title':
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
                    top: `${animatedCursorRect?.top}px`,
                    left: `${animatedCursorRect?.left}px`,
                    width: `${animatedCursorRect?.width}px`,
                    height: `${animatedCursorRect?.height}px`,
                    color: 'lime',
                }}
            />
        </>
    )
}
