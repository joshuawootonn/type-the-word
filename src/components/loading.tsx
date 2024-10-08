'use client'

import { useEffect, useRef } from 'react'

export function Loading(
    { initialDots }: { initialDots?: number } = { initialDots: 1 },
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
        <div className={'text-xl font-normal text-primary'} ref={ref}>
            {initialText.current}
        </div>
    )
}
