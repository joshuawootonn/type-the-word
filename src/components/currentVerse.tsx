import { Block, Inline, ParsedPassage, Verse } from '~/lib/parseEsv'
import React, { FormEvent, useContext, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import {
    PassageContext,
    passageIdAtom,
    autofocusAtom,
    currentVerseAtom,
    isPassageActiveAtom,
    isPassageFocusedAtom,
    keystrokesAtom,
    positionAtom,
} from '~/components/passage'
import { useSession } from 'next-auth/react'
import { getPosition, isAtomComplete, isValidKeystroke } from '~/lib/keystroke'
import { isAtomTyped, isVerseSameShape } from '~/lib/isEqual'
import clsx from 'clsx'
import { Word } from '~/components/word'
import { useRect } from '~/lib/hooks/useRect'
import { trackEvent } from 'fathom-client'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TypingSession } from '~/server/repositories/typingSession.repository'
import { fetchAddVerseToTypingSession } from '~/lib/api'
import { AddTypedVerseBody } from '~/app/api/typing-session/[id]/route'
import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'

const nativeInputEventSchema = z.discriminatedUnion('inputType', [
    z.object({
        data: z.string(),
        inputType: z.literal('insertText'),
    }),
    z.object({
        data: z.null(),
        inputType: z.literal('deleteContentBackward'),
    }),
    z.object({
        data: z.null(),
        inputType: z.literal('deleteWordBackward'),
    }),
    z.object({
        data: z.null(),
        inputType: z.literal('deleteSoftLineBackward'),
    }),
])

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
    isQuote,
    isIndented,
    passage,
    typingSession,
    chapterHistory,
}: {
    isCurrentVerse: boolean
    isIndented: boolean
    isQuote: boolean
    verse: Verse
    passage: ParsedPassage
    typingSession?: TypingSession
    chapterHistory?: ChapterHistory
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [position, setPosition] = useAtom(positionAtom)
    const [keystrokes, setKeystrokes] = useAtom(keystrokesAtom)
    const [passageId] = useAtom(passageIdAtom)
    const [autoFocus] = useAtom(autofocusAtom)
    const { data: sessionData } = useSession()

    const { rect: passageRect } = useContext(PassageContext)
    const [isPassageActive, setIsPassageActive] = useAtom(isPassageActiveAtom)
    const [isPassageFocused, setIsPassageFocused] =
        useAtom(isPassageFocusedAtom)
    const queryClient = useQueryClient()

    const addTypedVerseToSession = useMutation({
        mutationFn: (verse: AddTypedVerseBody) =>
            fetchAddVerseToTypingSession(verse.typingSessionId, verse),
        // When mutate is called:
        onMutate: async verse => {
            // Cancel any outgoing refetches
            // (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['typing-session'] })

            // Snapshot the previous value
            const previousTypingSession = queryClient.getQueryData([
                'typing-session',
            ])

            // Optimistically update to the new value
            queryClient.setQueryData<TypingSession>(
                ['typing-session'],
                prevTypingSession => {
                    if (prevTypingSession == null) {
                        return undefined
                    }

                    return {
                        ...prevTypingSession,
                        typedVerses: [
                            ...prevTypingSession.typedVerses,
                            {
                                ...verse,
                                id: crypto.randomUUID(),
                                userId: crypto.randomUUID(),
                                createdAt: new Date(),
                            },
                        ],
                    }
                },
            )

            // This waits to toggle the verse till ^ has gone through.
            // It prevents a flicker that can happen in this mutation.
            setTimeout(() => {
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
            })

            // Return a context object with the snapshotted value
            return { previousTypingSession }
        },
        // If the mutation fails,
        // use the context returned from onMutate to roll back
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(
                ['typing-session'],
                context?.previousTypingSession,
            )
        },
        // Always refetch after error or success:
        onSettled: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['typing-session'],
            })
            await queryClient.invalidateQueries({
                queryKey: ['last-verse'],
            })
        },
    })

    const ref = useRef<HTMLSpanElement>(null)
    const rect = useRect(ref)

    const [currentVerse, setCurrentVerse] = useAtom(currentVerseAtom)

    // This is necessary to autofocus on SSR
    useEffect(() => {
        if (autoFocus) {
            // This redundant call is so because the `input.onFocus`  wasn't firing
            // for chrome hard reload, and ff soft/hard reload.
            setIsPassageFocused(true)
            return inputRef.current?.focus()
        }
    }, [])

    const isActiveTimer = useRef<NodeJS.Timer>()

    useEffect(() => {
        clearTimeout(isActiveTimer.current)

        isActiveTimer.current = setTimeout(() => {
            setIsPassageActive(false)
        }, 3000)

        return () => clearTimeout(isActiveTimer.current)
    }, [keystrokes.length])

    function handleInput(event: FormEvent<HTMLInputElement>) {
        console.log(event, inputRef.current?.value)
        const result = nativeInputEventSchema.safeParse(event.nativeEvent)

        if (result.success) {
            const nativeInputEvent = result.data
            if (
                nativeInputEvent.inputType === 'insertText' &&
                nativeInputEvent.data === ' '
            ) {
                event.preventDefault()
            }
            let isVerseComplete = false

            setIsPassageActive(true)
            const currentVerseNodes = getWords(currentVerse, passage.nodes)
            if (currentVerseNodes == null) {
                throw new Error('Current ReadonlyVerse is invalid.')
            }

            const next = isValidKeystroke(nativeInputEvent, keystrokes)

            if (next == null) return
            const position = getPosition(next)

            isVerseComplete = isVerseSameShape(
                currentVerseNodes?.filter(isAtomTyped) ?? [],
                position,
            )

            if (isVerseComplete) {
                const verse = getVerse(currentVerse, passage.nodes)
                trackEvent('typed-verse')
                if (
                    typingSession?.id != null &&
                    sessionData?.user?.id != null
                ) {
                    void addTypedVerseToSession.mutateAsync({
                        book: verse.verse.book,
                        chapter: verse.verse.chapter,
                        verse: verse.verse.verse,
                        translation: verse.verse.translation,
                        typingSessionId: typingSession.id,
                    })
                } else {
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

    const isTypedInSession = typingSession?.typedVerses.find(
        a =>
            a.verse === verse.verse.verse &&
            a.chapter === verse.verse.chapter &&
            a.book === verse.verse.book &&
            a.translation === verse.verse.translation,
    )

    const isTypedInHistory = chapterHistory?.verses[verse.verse.verse]

    return (
        <span
            className={clsx(
                'verse break-spaces text-balance group inline h-3 hover:cursor-pointer',
                isCurrentVerse && 'active-verse',
                isTypedInSession ?? isTypedInHistory
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-black dark:text-white',
            )}
            ref={ref}
            onClick={() => {
                inputRef.current?.focus()
            }}
        >
            <span
                id={`${passageId}-scroll-anchor`}
                className={
                    'inline-block -translate-y-[300px] lg:-translate-y-[340px]'
                }
            />
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

            {isTypedInSession && rect && passageRect ? (
                <svg
                    className={
                        'absolute -bottom-1 -left-3 -top-1 right-full z-0 w-4 rounded-none md:-left-6'
                    }
                    style={
                        isQuote
                            ? {
                                  height: rect.height + 48,
                                  top: rect.top - passageRect.top - 24,
                              }
                            : {
                                  height: rect.height + 20,
                                  top: rect.top - passageRect.top - 10,
                              }
                    }
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line
                        className={'stroke-black dark:stroke-white'}
                        strokeWidth={'2'}
                        strokeLinejoin={'round'}
                        strokeLinecap={'round'}
                        x1="5px"
                        y1="0%"
                        x2="5px"
                        y2="100%"
                    />
                </svg>
            ) : null}

            {rect && passageRect && !isPassageFocused ? (
                <button
                    className={clsx(
                        'svg-outline absolute z-10 border-2 border-black bg-white/80 text-black opacity-0 backdrop-blur-sm transition-opacity duration-100 dark:border-white dark:bg-black/80 dark:text-white',
                        !isPassageActive && 'hover:opacity-100',
                        'focus:opacity-100',
                    )}
                    style={{
                        width: passageRect.width + 16,
                        height: rect.height + 16,
                        left: -8,
                        top: rect.top - passageRect.top - 8,
                    }}
                    onClick={() => {
                        setIsPassageFocused(true)
                    }}
                >
                    <span>Continue typing verse {verse.verse.value}</span>
                </button>
            ) : null}
            <input
                type="text"
                className="peer fixed h-0 max-h-0 opacity-0"
                onInput={handleInput}
                tabIndex={-1}
                onFocus={() => {
                    document
                        .getElementById(`${passageId}-scroll-anchor`)
                        ?.scrollIntoView({
                            block: 'start',
                            behavior: 'smooth',
                        })
                    setIsPassageFocused(true)
                }}
                onBlur={() => {
                    setIsPassageFocused(false)
                }}
                ref={inputRef}
                autoFocus={true}
            />
        </span>
    )
}
