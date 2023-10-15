import { animate } from 'motion'
import { useEffect, useRef } from 'react'

export function useCursor() {
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

            const activeRect =
                document
                    .querySelector(
                        '.active-verse .active-word span:not(.correct):not(.incorrect):not(.extra)',
                    )
                    ?.getBoundingClientRect() ??
                document
                    .querySelector('.active-verse .active-space')
                    ?.getBoundingClientRect()

            if (activeRect) {
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
                    '#cursor',
                    {
                        top:0,
                        left:0,
                        x: `${nextLeft}px`,
                        y: `${nextTop}px`,
                        width: `${activeRect.width}px`,
                        height: '19px',
                    },
                    {easing: "ease", duration:0.05}
                )
                return
            }
        }

        if (process.env.NODE_ENV === 'production') {
            let frame = requestAnimationFrame(function loop() {
                frame = requestAnimationFrame(loop)
                move()
            })

            return () => {
                cancelAnimationFrame(frame)
            }
        }

        let now = Date.now()
        let then = now
        const fpsInterval = 1000 / 60

        let frame = requestAnimationFrame(function loop() {
            frame = requestAnimationFrame(loop)

            now = Date.now()
            const elapsed = now - then

            if (elapsed > fpsInterval) {
                then = now - (elapsed % fpsInterval)

                move()
            }
        })

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [])
}
