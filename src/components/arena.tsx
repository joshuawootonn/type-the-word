/* eslint-disable @typescript-eslint/ban-ts-comment */
import clsx from 'clsx'
import equal from 'fast-deep-equal'
import { useRef, useState, useEffect } from 'react'

import { isAtomTyped, isVerseEqual } from '~/lib/isEqual'
import { Atom, parseChapter } from '~/lib/parseEsv'
import { EsvPassageSchema } from '~/server/api/routers/passage'

import { Word } from './atom'

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
    const [keystrokes, setKeystrokes] = useState<Keystroke[]>([])
    const [position, setPosition] = useState<Atom[]>([] as Atom[])

    const [currentVersePosition, setCurrentVersePosition] = useState(
        chapter.flatMap(node => ('nodes' in node ? node.nodes : [])).at(0)
            ?.verse,
    )

    function handleInput(e: React.KeyboardEvent<HTMLInputElement>) {
        console.log(e.key)
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
            setKeystrokes(prev => {
                const next = prev.concat({
                    type: e.key === 'Backspace' ? 'backspace' : 'insert',
                    key: e.key,
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

                isVerseComplete && console.log('verse complete')
                console.log({
                    isVerseComplete,
                    currentVerse: currentVerse?.nodes.filter(isAtomTyped) ?? [],
                    position,
                })

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
                // console.log({
                //     isVerseComplete,
                //     currentVerse,
                //     position,
                //     keystrokes,
                // })

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

    console.log('render', { chapter })

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
                            <p className="font-[0px]" key={pIndex}>
                                {node.nodes.map((verse, vIndex) => {
                                    const isCurrentVerse =
                                        currentVersePosition === verse.verse

                                    return (
                                        <span
                                            key={vIndex}
                                            className={clsx(
                                                'verse break-spaces text-balance inline h-3',
                                                isCurrentVerse &&
                                                    'active-verse',
                                            )}
                                            onClick={() => {
                                                inputRef.current?.focus()
                                            }}
                                        >
                                            <b>{verse.verse}</b>
                                            {!isCurrentVerse
                                                ? verse.nodes.map(
                                                      (atom, aIndexPrime) => {
                                                          if (
                                                              atom.type ===
                                                              'newLine'
                                                          )
                                                              return <br />

                                                          if (
                                                              atom.type ===
                                                              'space'
                                                          ) {
                                                              return (
                                                                  <span
                                                                      key={
                                                                          aIndexPrime
                                                                      }
                                                                      className={clsx(
                                                                          'space inline-flex h-[19px] w-3',
                                                                      )}
                                                                  >
                                                                      {' '}
                                                                  </span>
                                                              )
                                                          }
                                                          if (
                                                              atom.type ===
                                                              'word'
                                                          ) {
                                                              return (
                                                                  <Word
                                                                      key={
                                                                          aIndexPrime
                                                                      }
                                                                      atom={
                                                                          atom
                                                                      }
                                                                      active={
                                                                          false
                                                                      }
                                                                      isPrevTyped={
                                                                          false
                                                                      }
                                                                      isAtomTyped={
                                                                          false
                                                                      }
                                                                  />
                                                              )
                                                          }

                                                          return null
                                                      },
                                                  )
                                                : verse.nodes.map(
                                                      (atom, aIndexPrime) => {
                                                          const aIndex =
                                                              verse.nodes
                                                                  .slice(
                                                                      0,
                                                                      aIndexPrime,
                                                                  )
                                                                  .filter(
                                                                      isAtomTyped,
                                                                  ).length

                                                          const lastAtom =
                                                              position.at(
                                                                  aIndex - 1,
                                                              )
                                                          const typedAtom =
                                                              position.at(
                                                                  aIndex,
                                                              )

                                                          const nextAtom =
                                                              position.at(
                                                                  aIndex + 1,
                                                              )
                                                          if (
                                                              atom.type ===
                                                              'newLine'
                                                          )
                                                              return (
                                                                  <>
                                                                      <span
                                                                          className={clsx(
                                                                              'inline-flex h-[19px]  items-center justify-center px-2 opacity-0 transition-opacity',
                                                                              lastAtom !=
                                                                                  null &&
                                                                                  typedAtom ==
                                                                                      null &&
                                                                                  'active-space opacity-100',
                                                                          )}
                                                                      >
                                                                          <svg
                                                                              className="translate-y-0.5"
                                                                              width="16"
                                                                              height="16"
                                                                              viewBox="0 0 16 16"
                                                                              fill="none"
                                                                              xmlns="http://www.w3.org/2000/svg"
                                                                          >
                                                                              <path
                                                                                  d="M12.5611 4.33774C12.5611 4.33774 12.5611 4.84212 12.5611 5.82744C12.5611 7.72453 11.5283 8.55823 9.83026 8.55823C6.99146 8.55823 2.56105 8.55823 2.56105 8.55823M2.56105 8.55823C2.56105 8.39635 4.96506 5.82744 4.96506 5.82744M2.56105 8.55823C2.56105 8.72012 4.12224 10.3498 4.96506 11.2455"
                                                                                  stroke="black"
                                                                                  stroke-width="2"
                                                                                  stroke-linecap="round"
                                                                                  stroke-linejoin="round"
                                                                              />
                                                                          </svg>
                                                                      </span>
                                                                      <br />
                                                                  </>
                                                              )

                                                          if (
                                                              atom.type ===
                                                              'space'
                                                          ) {
                                                              return (
                                                                  <span
                                                                      key={
                                                                          aIndexPrime
                                                                      }
                                                                      className={clsx(
                                                                          'space inline-flex h-[19px] w-3',
                                                                          lastAtom !=
                                                                              null &&
                                                                              typedAtom ==
                                                                                  null &&
                                                                              'active-space',
                                                                      )}
                                                                  >
                                                                      {' '}
                                                                  </span>
                                                              )
                                                          }
                                                          if (
                                                              atom.type ===
                                                                  'word' &&
                                                              (typedAtom ==
                                                                  null ||
                                                                  typedAtom.type ===
                                                                      'word')
                                                          ) {
                                                              // if (
                                                              //     atom.letters.length ===
                                                              //         7 &&
                                                              //     atom.letters[0] === 'B'
                                                              // )
                                                              //     console.log(
                                                              //         'word',
                                                              //         atom,
                                                              //         typedAtom,
                                                              //         position,
                                                              //         aIndex,
                                                              //     )
                                                              return (
                                                                  <Word
                                                                      key={
                                                                          aIndexPrime
                                                                      }
                                                                      atom={
                                                                          atom
                                                                      }
                                                                      active={
                                                                          (aIndex ===
                                                                              0 ||
                                                                              lastAtom !=
                                                                                  null) &&
                                                                          nextAtom ==
                                                                              null
                                                                      }
                                                                      typedAtom={
                                                                          typedAtom
                                                                      }
                                                                      isPrevTyped={
                                                                          (position.length ===
                                                                              0 &&
                                                                              aIndex ===
                                                                                  0) ||
                                                                          !!lastAtom
                                                                      }
                                                                      isAtomTyped={
                                                                          !!nextAtom
                                                                      }
                                                                  />
                                                              )
                                                          }

                                                          return null
                                                      },
                                                  )}
                                        </span>
                                    )
                                })}
                            </p>
                        )
                    case 'footnote':
                        return null
                    // return (
                    //     <p key={pIndex} className="my-2">
                    //         <b>{node.verse}</b>
                    //         {node.text}
                    //     </p>
                    // )
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
