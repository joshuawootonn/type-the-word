"use client"

import { useEffect, useRef } from "react"

import { cn } from "~/lib/cn"

export function Loading(
    {
        initialDots,
        className,
        label = "Loading",
    }: { initialDots?: number; className?: string; label?: string } = {
        initialDots: 1,
    },
) {
    const initialText = useRef(
        `${label}${new Array(initialDots)
            .fill("")
            .map(() => ".")
            .join("")}`,
    )
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                const isMaxLength =
                    ref.current.innerText.replace(label, "").length >= 3
                ref.current.innerText = isMaxLength
                    ? `${label}.`
                    : ref.current.innerText + "."
            }
        }, 240)

        return () => clearInterval(interval)
    }, [label])

    return (
        <div className={cn("text-xl font-normal", className)} ref={ref}>
            {initialText.current}
        </div>
    )
}
