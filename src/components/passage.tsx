'use client'

import React, { useId, useRef } from 'react'

import { Inline, ParsedPassage } from '~/lib/parseEsv'

import { Paragraph } from './paragraph'
import { Keystroke } from '~/lib/keystroke'
import { Cursor } from '~/components/cursor'
import { atom, PrimitiveAtom, Provider } from 'jotai'
import { useRect } from '~/lib/hooks/useRect'
import { useHydrateAtoms } from 'jotai/react/utils'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toPassageSegment } from '~/lib/passageSegment'
import { fetchChapterHistory, fetchTypingSessionUpsert } from '~/lib/api'

export const PassageContext = React.createContext<{
    rect: DOMRect | null
}>({
    rect: null,
})

export const positionAtom = atom<Inline[]>([])
export const keystrokesAtom = atom<Keystroke[]>([])

export const isPassageActiveAtom = atom(false)
export const isPassageFocusedAtom = atom(false)

export const currentVerseAtom = atom<string>('')
export const autofocusAtom = atom(false)
export const passageIdAtom = atom<string>('')

type InitialValues<T> = [PrimitiveAtom<T>, T]

function HydrateAtoms({
    initialValues,
    children,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValues: InitialValues<any>[]
    children: React.ReactNode
}) {
    useHydrateAtoms(initialValues)
    return children
}

export function Passage({
    passage,
    ...props
}: {
    passage: ParsedPassage
    autofocus?: boolean
    autoSelect?: boolean
}) {
    const passageId = useId()

    const passageRef = useRef<HTMLDivElement>(null)
    const passageRect = useRect(passageRef)
    const { data: sessionData } = useSession()
    const typingSession = useQuery({
        queryKey: ['typing-session'],
        queryFn: fetchTypingSessionUpsert,
        enabled: sessionData?.user?.id != null,
    })
    const chapterHistory = useQuery({
        queryKey: ['chapter-history'],
        queryFn: () =>
            fetchChapterHistory(
                toPassageSegment(
                    passage.firstVerse.book,
                    passage.firstVerse.chapter,
                ),
            ),
        enabled: sessionData?.user?.id != null,
    })

    const isRootPath = usePathname() === '/'
    const H2Component = isRootPath ? 'h2' : 'h1'

    return (
        <Provider>
            <HydrateAtoms
                initialValues={[
                    [
                        currentVerseAtom,
                        props.autoSelect ? passage.firstVerse.value : '',
                    ],
                    [autofocusAtom, props.autofocus],
                    [passageIdAtom, passageId],
                ]}
            >
                <div
                    ref={passageRef}
                    id={passageId}
                    className="passage prose relative z-0 w-full dark:prose-invert"
                >
                    <PassageContext.Provider
                        value={{
                            rect: passageRect,
                        }}
                    >
                        {passage.nodes.map((node, pIndex) => {
                            switch (node.type) {
                                case 'paragraph':
                                    return (
                                        <Paragraph
                                            key={pIndex}
                                            node={node}
                                            passage={passage}
                                            typingSession={typingSession}
                                            chapterHistory={chapterHistory}
                                        />
                                    )

                                case 'h2':
                                    return (
                                        <H2Component
                                            key={pIndex}
                                            className="prose-h2 mb-4 mt-2 text-2xl"
                                        >
                                            {node.text}
                                        </H2Component>
                                    )
                                case 'h3':
                                    return (
                                        <h3
                                            className="prose-h3 mt-0 text-xl font-semibold tracking-wide"
                                            key={pIndex}
                                        >
                                            {node.text}
                                        </h3>
                                    )
                                case 'h4':
                                    return (
                                        <h4
                                            className="prose-h4 text-lg font-medium tracking-wide"
                                            key={pIndex}
                                        >
                                            {node.text}
                                        </h4>
                                    )

                                default:
                                    break
                            }
                        })}
                    </PassageContext.Provider>
                    <Cursor passageId={passageId} />
                </div>
            </HydrateAtoms>
        </Provider>
    )
}
