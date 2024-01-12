import React from 'react'
import { useCursor } from '~/lib/hooks'
import clsx from 'clsx'
import { useAtom } from 'jotai'
import { isPassageActiveAtom, isPassageFocusedAtom } from '~/components/passage'

export function Cursor({ passageId }: { passageId: string }) {
    const [isPassageActive] = useAtom(isPassageActiveAtom)
    const [isPassageFocused] = useAtom(isPassageFocusedAtom)
    useCursor(passageId)
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
                id={`${passageId}-cursor`}
                className={clsx(
                    'absolute rounded-lg bg-black dark:bg-white',
                    !isPassageActive && 'blink',
                    isPassageFocused ? 'opacity-100' : 'opacity-0',
                )}
            />
        </>
    )
}
