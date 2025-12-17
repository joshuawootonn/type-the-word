'use client'

import { useEffect, useRef } from 'react'

import { cn } from '~/lib/cn'

export function Loading(
    { initialDots, className }: { initialDots?: number; className?: string } = {
        initialDots: 1,
    },
) {
    const initialText = useRef(
        `Loading${new Array(initialDots)
            .fill('')
            .map(() => '.')
            .join('')}`,
    )
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                const isMaxLength =
                    ref.current.innerText.replace('Loading', '').length >= 3
                ref.current.innerText = isMaxLength
                    ? 'Loading.'
                    : ref.current.innerText + '.'
            }
        }, 240)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className={cn('text-xl font-normal', className)} ref={ref}>
            {initialText.current}
        </div>
    )
}
