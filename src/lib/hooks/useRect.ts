import { RefObject, useEffect, useState } from 'react'

export function useRect(ref: RefObject<HTMLElement>) {
    const [rect, setRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        function updateRect() {
            const nextRect = ref.current?.getBoundingClientRect() ?? null
            if (
                nextRect &&
                (nextRect.top !== rect?.top ||
                    nextRect.height !== rect?.height ||
                    nextRect.width !== rect?.width ||
                    nextRect.left !== rect?.left)
            ) {
                setRect(nextRect)
            }
        }

        window.addEventListener('resize', updateRect)
        window.addEventListener('scroll', updateRect)
        updateRect()
        return () => {
            window.removeEventListener('scroll', updateRect)
            window.removeEventListener('resize', updateRect)
        }
    }, [])

    return rect
}
