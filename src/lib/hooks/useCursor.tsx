import { animate } from 'motion'
import { useEffect, useRef } from 'react'

export function useCursor(arenaId: string): void {
    const prev = useRef<{
        top: string | number
        left: string | number
        width: string | number
    }>({
        top: `0px`,
        left: `0px`,
        width: `0px`,
    })

    useEffect(() => {
        function move() {
            const arena = document.querySelector('.arena')
            const arenaRect = arena?.getBoundingClientRect()
            if (arenaRect == null) return

            let activeElement = document.querySelector(
                `#${CSS.escape(
                    arenaId,
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
                const nextTop = activeRect.top - arenaRect.top
                const nextLeft = activeRect.left - arenaRect.left
                if (
                    nextTop === prev.current.top &&
                    nextLeft === prev.current.left &&
                    activeRect.width === prev.current.width
                )
                    return
                prev.current = {
                    top: nextTop,
                    left: nextLeft,
                    width: activeRect.width,
                }

                // Don't try to use Glide. It uses some bunk default values that throw.
                animate(
                    `#${CSS.escape(arenaId)}-cursor`,
                    {
                        top: 0,
                        left: 0,
                        x: `${nextLeft}px`,
                        y: `${nextTop}px`,
                        width: `${activeRect.width}px`,
                        height: '19px',
                    },
                    { easing: 'ease', duration: 0.05 },
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
    }, [])
}
