import { useEffect, useRef } from 'react'

export function Loading(
    { initialDots, text }: { initialDots?: number; text?: string } = {
        initialDots: 1,
        text: 'Loading',
    },
) {
    const initialText = useRef(
        `${text}${new Array(initialDots)
            .fill('')
            .map(() => '.')
            .join('')}`,
    )
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                const isMaxLength =
                    ref.current.innerText.replace(text ?? '', '').length >= 3
                ref.current.innerText = isMaxLength
                    ? `${text}.`
                    : ref.current.innerText + '.'
            }
        }, 240)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className={'text-xl font-normal'} ref={ref}>
            {initialText.current}
        </div>
    )
}
