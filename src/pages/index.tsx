import { clsx } from 'clsx'
import { signIn, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'

import { api } from '~/utils/api'

const verseRegex = /\[[0-9]+\].*?(?=\[|$)/g
const footnoteRegex = /\([0-9]+\).*?(?=\(|$)/g
const verseNumberRegex = /\[[0-9]+\]/g
const numberRegex = /[0-9]+/g
const footnoteNumberRegex = /\([0-9]+\)/g

type Passage =
    | { type: 'newLine' }
    | { type: 'title'; text: string }
    | {
          type: 'paragraph'
          nodes: {
              type: 'verse'
              verse: string
              text: string
              splitText: string[][]
          }[]
      }
    | { type: 'footnote'; verse: string; text: string }

const validQuotes = [
    '“', // U+201c
    '”', // U+201d
    '«', // U+00AB
    '»', // U+00BB
    '„', // U+201E
    '“', // U+201C
    '‟', // U+201F
    '”', // U+201D
    '❝', // U+275D
    '❞', // U+275E
    '〝', // U+301D
    '〞', // U+301E
    '〟', // U+301F
    '＂', // U+FF02
]

function parseChapter(passage: string): Passage[] {
    return passage
        .replace('(ESV)', '')
        .split('\n')
        .flatMap((line): Passage[] => {
            if (line === '') {
                return []
            } else if (verseRegex.test(line)) {
                const verseNodes = []
                for (const match of line.match(verseRegex) ?? []) {
                    const text = match
                        .replace(verseNumberRegex, '')
                        .replace(footnoteNumberRegex, '')
                        .trimStart()

                    verseNodes.push({
                        type: 'verse' as const,
                        verse: match.match(numberRegex)?.[0] ?? '',
                        text,
                        splitText: text
                            .split(' ')
                            .map(word => word.split(''))
                            .concat([]),
                    })
                }
                // console.log({ parseVerseNodes: verseNodes })

                return [{ type: 'paragraph' as const, nodes: verseNodes }]
            } else if (footnoteRegex.test(line)) {
                const footnoteNodes = []
                for (const match of line.match(footnoteRegex) ?? []) {
                    footnoteNodes.push({
                        type: 'footnote' as const,
                        verse: match.match(footnoteNumberRegex)?.[0] ?? '',
                        text: match
                            .replace(verseNumberRegex, '')
                            .replace(footnoteNumberRegex, ''),
                    })
                }

                return footnoteNodes
            } else {
                return [{ type: 'title' as const, text: line }]
            }
            return []
        })
}

function getPosition(
    keystrokes: { inputType: string; data: string }[] = [],
): string[][] {
    return keystrokes.reduce(
        (acc, keystroke) => {
            if (
                keystroke.inputType === 'insertText' &&
                keystroke.data === ' '
            ) {
                return [...acc, []]
            } else if (keystroke.inputType === 'insertText' && keystroke.data) {
                return [
                    ...acc.slice(0, -1),
                    (acc.at(-1) ?? []).concat(keystroke.data),
                ]
            } else if (keystroke.inputType === 'deleteContentBackward') {
                if (acc.at(-1)?.length === 0) {
                    return acc.slice(0, -1)
                }

                return [...acc.slice(0, -1), (acc.at(-1) ?? []).slice(0, -1)]
            }
            return [...acc]
        },
        [[]] as string[][],
    )
}

function isLetterEqual(correct?: string, typed?: string) {
    if (correct === undefined || typed === undefined) return correct === typed

    if (typed === '"') {
        console.log(
            { a: correct, b: typed },
            correct === typed,
            validQuotes.includes(typed),
        )

        return correct === typed || validQuotes.includes(correct)
    }

    return correct === typed
}

function isMatrixEqual(a: string[][], b: string[][]) {
    return (
        a.length === b.length &&
        a.every((row, i) => row.length === b.at(i)?.length) &&
        a.every((row, i) =>
            row.every((letter, j) => isLetterEqual(letter, b.at(i)?.at(j))),
        )
    )
}

function MyComponent({ passage }: { passage: any }) {
    // console.log({ passage })

    const chapter = parseChapter(passage.data?.passages.at(0) ?? '')
    const inputRef = useRef<HTMLInputElement>(null)
    const [keystrokes, setKeystrokes] = useState<
        { inputType: string; data: string }[]
    >([])
    const [position, setPosition] = useState<string[][]>([[]] as string[][])

    const [currentVersePosition, setCurrentVersePosition] = useState(
        chapter.flatMap(node => ('nodes' in node ? node.nodes : [])).at(0)
            ?.verse,
    )

    function handleInput(e: React.FormEvent<HTMLInputElement>) {
        if (
            e.nativeEvent.inputType === 'insertText' ||
            e.nativeEvent.inputType === 'deleteContentBackward'
        ) {
            // console.log(e.nativeEvent.inputType, e.nativeEvent.data)

            setKeystrokes(prev => {
                const next = prev.concat({
                    inputType: e.nativeEvent.inputType,
                    data: e.nativeEvent.data,
                })

                const position = getPosition(next)

                const currentVerse = chapter
                    .flatMap(node => ('nodes' in node ? node.nodes : []))
                    .find(verse => verse.verse === currentVersePosition)
                if (currentVerse == null) return next

                const isVerseComplete = isMatrixEqual(
                    currentVerse?.splitText,
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
                    setPosition([[]])
                    return []
                }

                setPosition(position)
                // console.log({ isVerseComplete, currentVerse, position })

                return next
            })
        }
    }

    function isEqual(a: string[], b: string[]) {
        return (
            a.length === b.length && a.every((A, i) => isLetterEqual(A, b[i]))
        )
    }

    // console.log({ currentVersePosition, position })

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

        let frame = requestAnimationFrame(function loop(t) {
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
                                                inputRef.current?.focus()
                                            }}
                                        >
                                            <b className="">
                                                {verse.verse}&nbsp;
                                            </b>
                                            {!isCurrentVerse
                                                ? verse.text
                                                : verse.splitText.map(
                                                      (word, wIndex) => {
                                                          const typedWord =
                                                              position.at(
                                                                  wIndex,
                                                              )
                                                          const extras =
                                                              typedWord?.slice(
                                                                  word.length,
                                                              )
                                                          const wordIsTyped =
                                                              position.at(
                                                                  wIndex + 1,
                                                              )
                                                          return (
                                                              <>
                                                                  <span
                                                                      key={
                                                                          wIndex
                                                                      }
                                                                      className={clsx(
                                                                          'word',
                                                                          typedWord &&
                                                                              wordIsTyped ==
                                                                                  null &&
                                                                              'active',
                                                                          typedWord &&
                                                                              wordIsTyped &&
                                                                              !isEqual(
                                                                                  word,
                                                                                  typedWord,
                                                                              ) &&
                                                                              'underline decoration-rose-500',
                                                                      )}
                                                                  >
                                                                      {extras?.length &&
                                                                      typedWord
                                                                          ? typedWord.map(
                                                                                (
                                                                                    letter,
                                                                                    lIndex,
                                                                                ) => {
                                                                                    const correctLetter =
                                                                                        word?.at(
                                                                                            lIndex,
                                                                                        )
                                                                                    const isEqual =
                                                                                        isLetterEqual(
                                                                                            correctLetter,
                                                                                            letter,
                                                                                        )

                                                                                    return (
                                                                                        <span
                                                                                            data-letter
                                                                                            key={
                                                                                                lIndex
                                                                                            }
                                                                                            className={clsx(
                                                                                                'letter',
                                                                                                isEqual &&
                                                                                                    'correct text-emerald-500',
                                                                                                correctLetter &&
                                                                                                    !isEqual &&
                                                                                                    'incorrect text-rose-700',
                                                                                                lIndex >
                                                                                                    word.length -
                                                                                                        1 &&
                                                                                                    'extra text-rose-700',
                                                                                            )}
                                                                                        >
                                                                                            {
                                                                                                letter
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                },
                                                                            )
                                                                          : word.map(
                                                                                (
                                                                                    letter,
                                                                                    lIndex,
                                                                                ) => {
                                                                                    const typedLetter =
                                                                                        typedWord?.at(
                                                                                            lIndex,
                                                                                        )
                                                                                    const isEqual =
                                                                                        isLetterEqual(
                                                                                            letter,
                                                                                            typedLetter,
                                                                                        )
                                                                                    return (
                                                                                        <span
                                                                                            data-letter
                                                                                            key={
                                                                                                lIndex
                                                                                            }
                                                                                            className={clsx(
                                                                                                'letter',
                                                                                                isEqual &&
                                                                                                    'correct text-emerald-500',
                                                                                                typedLetter &&
                                                                                                    !isEqual &&
                                                                                                    'incorrect text-rose-700',
                                                                                            )}
                                                                                        >
                                                                                            {
                                                                                                letter
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                },
                                                                            )}
                                                                  </span>
                                                                  <span className="space">
                                                                      {' '}
                                                                  </span>
                                                              </>
                                                          )
                                                      },
                                                  )}
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

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

export default function Home() {
    const [value, setValue] = useState('John 11:35-38')
    const debouncedValue = useDebounce(value, 2000)
    const passage = api.passage.passage.useQuery(debouncedValue)

    return (
        <div className="container min-h-screen flex flex-col mx-auto">
            <Head>
                <title>Create T3 App</title>
                <meta name="description" content="Generated by create-t3-app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <nav className="prose mx-auto w-full flex justify-between items-center mb-2 pt-8">
                <h1 className="text-xl font-mono font-extrabold tracking-tight text-black m-0">
                    type the word
                </h1>
                <AuthShowcase />
            </nav>
            <div className="prose mx-auto w-full flex justify-start space-x-3 items-center mb-8 pt-8">
                <label htmlFor="passage" className="text-black">
                    Passage:
                </label>
                <input
                    type="text"
                    className="border-black border-2 p-1 outline-none focus-visible:outline-black"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            </div>

            <main className="arena relative prose mx-auto flex-grow">
                {passage.isLoading ? null : <MyComponent passage={passage} />}
            </main>
            <footer className="prose mx-auto flex w-full justify-start items-start py-2">
                <a
                    className="no-underline flex-grow text-xs"
                    href="https://www.esv.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    (ESV)
                </a>
            </footer>
        </div>
    )
}

function AuthShowcase() {
    const { data: sessionData } = useSession()

    const { data: secretMessage } = api.example.getSecretMessage.useQuery(
        undefined, // no input
        { enabled: sessionData?.user !== undefined },
    )

    return (
        <div className="flex flex-col  gap-4">
            {/* <p className="text-center text-2xl text-black">
                    {sessionData && (
                        <span>Logged in as {sessionData.user?.name}</span>
                    )}
                    {secretMessage && <span> - {secretMessage}</span>}
                </p> */}
            <button
                className="border-2 border-black py-1 px-3 font-semibold text-black outline-none focus-visible:outline-black"
                onClick={
                    sessionData ? () => void signOut() : () => void signIn()
                }
            >
                {sessionData ? 'Sign out' : 'Sign in'}
            </button>
        </div>
    )
}
