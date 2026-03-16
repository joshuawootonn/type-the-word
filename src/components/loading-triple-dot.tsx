"use client"

import { useEffect, useState } from "react"
import { type ReactElement } from "react"

import { cn } from "~/lib/cn"

type LoadingTripleDotProps = {
    className?: string
    size?: number
    ariaLabel?: string
}

export function LoadingTripleDot({
    className,
    size = 20,
    ariaLabel = "Loading",
}: LoadingTripleDotProps): ReactElement {
    const [frame, setFrame] = useState(0)
    const visibleDots = (frame % 3) + 1

    useEffect(() => {
        const interval = window.setInterval(() => {
            setFrame(current => (current + 1) % 3)
        }, 240)

        return () => window.clearInterval(interval)
    }, [])

    return (
        <span
            role="status"
            aria-label={ariaLabel}
            className={cn(
                "inline-flex -translate-y-[0.5px] items-center justify-center leading-none",
                className,
            )}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                fill="currentColor"
                viewBox="0 0 256 256"
                aria-hidden="true"
            >
                <circle
                    cx="60"
                    cy="128"
                    r="16"
                    opacity={visibleDots >= 1 ? 1 : 0.25}
                />
                <circle
                    cx="128"
                    cy="128"
                    r="16"
                    opacity={visibleDots >= 2 ? 1 : 0.25}
                />
                <circle
                    cx="196"
                    cy="128"
                    r="16"
                    opacity={visibleDots >= 3 ? 1 : 0.25}
                />
            </svg>
        </span>
    )
}
