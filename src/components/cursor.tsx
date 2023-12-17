import React from 'react'
import { useCursor } from '~/lib/hooks'
import clsx from 'clsx'
import { useAtom } from 'jotai'
import { isArenaActiveAtom, isArenaFocusedAtom } from '~/components/arena'

export function Cursor({ arenaId }: { arenaId: string }) {
    const [isArenaActive] = useAtom(isArenaActiveAtom)
    const [isArenaFocused] = useAtom(isArenaFocusedAtom)
    useCursor(arenaId)
    return (
        <>
            <style jsx>{`
                @keyframes blink {
                    50% {
                        opacity: 0;
                    }
                }
                .blink {
                    animation: blink ease 1s 0s infinite;
                }
            `}</style>

            <div
                id={`${arenaId}-cursor`}
                className={clsx(
                    'absolute rounded-lg bg-black dark:bg-white',
                    !isArenaActive && 'blink',
                    isArenaFocused ? 'opacity-100' : 'opacity-0',
                )}
            />
        </>
    )
}
