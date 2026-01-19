import clsx from "clsx"
import { useAtom } from "jotai"
import React from "react"

import { isPassageActiveAtom, isPassageFocusedAtom } from "~/components/passage"
import { useCursor } from "~/lib/hooks"

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
                    "absolute rounded-lg bg-primary",
                    !isPassageActive && "blink",
                    isPassageFocused ? "opacity-100" : "opacity-0",
                )}
            />
        </>
    )
}
