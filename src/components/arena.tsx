import React, { useEffect, useId, useRef } from 'react'

import { Inline, ParsedPassage } from '~/lib/parseEsv'

import { Paragraph } from './paragraph'
import { Keystroke } from '~/lib/keystroke'
import { Cursor } from '~/components/cursor'
import { atom, PrimitiveAtom, Provider, useSetAtom } from 'jotai'
import { useRect } from '~/lib/hooks/useRect'
import { useHydrateAtoms } from 'jotai/react/utils'

export const ArenaContext = React.createContext<{
    rect: DOMRect | null
}>({
    rect: null,
})

export const positionAtom = atom<Inline[]>([])
export const keystrokesAtom = atom<Keystroke[]>([])

export const isArenaActiveAtom = atom(false)
export const isArenaFocusedAtom = atom(false)

export const currentVerseAtom = atom<string>('')
export const autofocusAtom = atom(false)

type InitialValues<T> = [PrimitiveAtom<T>, T]

function HydrateAtoms({
    initialValues,
    children,
}: {
    initialValues: InitialValues<any>[]
    children: React.ReactNode
}) {
    useHydrateAtoms(initialValues)
    return children
}

export function Arena({
    passage,
    autofocus,
}: {
    passage: ParsedPassage
    autofocus: boolean
}) {
    const arenaId = useId()

    const arenaRef = useRef<HTMLDivElement>(null)
    const arenaRect = useRect(arenaRef)

    return (
        <Provider>
            <HydrateAtoms
                initialValues={[
                    [currentVerseAtom, passage.firstVerse.value],
                    [autofocusAtom, autofocus],
                ]}
            >
                <div
                    ref={arenaRef}
                    id={arenaId}
                    className="arena prose relative z-0 w-full"
                >
                    <ArenaContext.Provider
                        value={{
                            rect: arenaRect,
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
                                        />
                                    )

                                case 'h2':
                                    return (
                                        <h2
                                            key={pIndex}
                                            className="tracking-tight"
                                        >
                                            {node.text}
                                        </h2>
                                    )
                                case 'h3':
                                    return (
                                        <h3
                                            key={pIndex}
                                            className="tracking-tight"
                                        >
                                            {node.text}
                                        </h3>
                                    )
                                case 'h4':
                                    return (
                                        <h4
                                            key={pIndex}
                                            className="tracking-tight"
                                        >
                                            {node.text}
                                        </h4>
                                    )

                                default:
                                    break
                            }
                        })}
                    </ArenaContext.Provider>
                    <Cursor arenaId={arenaId} />
                </div>
            </HydrateAtoms>
        </Provider>
    )
}
