import { animate } from 'motion'
import { useEffect, useRef } from 'react'

function pythagorean(x1: number, x2: number, y1: number, y2: number): number {
    return Math.sqrt(
        Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2),
    )
}

export function useCursor(passageId: string): void {
    const prev = useRef<{
        top: number
        left: number
    }>({
        top: 0,
        left: 0,
    })

    useEffect(() => {
        function move() {
            const passage = document.querySelector(`#${CSS.escape(passageId)}`)
            const passageRect = passage?.getBoundingClientRect()
            if (passageRect == null) return

            let activeElement = document.querySelector(
                `#${CSS.escape(
                    passageId,
                )} .active-verse .active-word:not(.error) .letter:not(.correct):not(.incorrect):not(.extra)`,
            )

            let activeRect = activeElement?.getBoundingClientRect()

            if (activeRect) {
                if (activeRect.width === 0) {
                    const indicator = activeElement?.querySelector('.indicator')

                    if (indicator) {
                        activeElement = indicator
                        activeRect =
                            activeElement?.getBoundingClientRect() ?? activeRect
                    }
                }
                const nextTop = activeRect.top - passageRect.top
                const nextLeft = activeRect.left - passageRect.left
                if (
                    nextTop === prev.current.top &&
                    nextLeft === prev.current.left
                )
                    return

                const distance = pythagorean(
                    prev.current.left ?? 0,
                    nextLeft,
                    prev.current.top ?? 0,
                    nextTop,
                )

                prev.current = {
                    top: nextTop,
                    left: nextLeft,
                }

                // Don't try to use Glide. It uses some bunk default values that throw.
                animate(
                    `#${CSS.escape(passageId)}-cursor`,
                    {
                        top: 0,
                        left: 0,
                        x: `${nextLeft}px`,
                        y: `${nextTop}px`,
                        width: `2px`,
                        height: '22px',
                    },
                    {
                        easing: [0.25, 0.46, 0.45, 0.94],
                        duration:
                            distance > 80 ||
                            Math.abs(nextTop - prev.current.top) > 2
                                ? 0
                                : 0.085,
                    },
                )

                return
            }
        }

        let frame = requestAnimationFrame(function loop() {
            frame = requestAnimationFrame(loop)
            move()
        })

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [passageId])
}
