import React from 'react'
import { useCursor } from '~/lib/hooks'
import clsx from 'clsx'

export function Cursor({
    arenaId,
    isArenaActive,
    isArenaFocused,
}: {
    arenaId: string
    isArenaActive: boolean
    isArenaFocused: boolean
}) {
    console.log({ arenaId, isArenaActive, isArenaFocused })
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
                    'rounded-sm/10 absolute bg-black/20',
                    !isArenaActive && 'blink',
                    isArenaFocused ? 'opacity-100' : 'opacity-0',
                )}
            />
        </>
    )
}
