import { RefObject, useEffect, useState } from 'react'
import debounce from 'debounce'

export function useRect(ref: RefObject<HTMLElement>) {
    const [rect, setRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        const debouncedUpdateRect = debounce(updateRect, 100)

        function updateRect() {
            const nextRect = ref.current?.getBoundingClientRect() ?? null
            console.log('hit')
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

        window.addEventListener('resize', debouncedUpdateRect)
        window.addEventListener('scroll', debouncedUpdateRect)
        debouncedUpdateRect()
        return () => {
            window.removeEventListener('scroll', debouncedUpdateRect)
            window.removeEventListener('resize', debouncedUpdateRect)
        }
    }, [])

    return rect
}
