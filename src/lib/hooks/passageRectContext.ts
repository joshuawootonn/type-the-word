import {
    RefObject,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react'

export type PassageRectContext = {
    rect: DOMRect | null
    verseRects: Record<string, DOMRect | null>
    updateVerseRect: (verse: string, rect: DOMRect) => void
}

export const PassageRectContext = createContext<PassageRectContext>({
    rect: null,
    verseRects: {},
    updateVerseRect: () => {
        console.info(
            'Whoops! Looks like you used this outside of a passage context',
        )
    },
})

export function usePassageRect() {
    const { rect: passageRect } = useContext(PassageRectContext)
    return passageRect
}

export function useRect(ref: RefObject<HTMLElement | null>) {
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
    }, [rect?.height, rect?.left, rect?.top, rect?.width, ref])

    return rect
}

export function useVerseRect(
    ref: RefObject<HTMLElement | null>,
    verse: string,
) {
    const { verseRects, updateVerseRect } = useContext(PassageRectContext)

    useEffect(() => {
        function updateRect() {
            const nextRect = ref.current?.getBoundingClientRect() ?? null
            if (
                nextRect &&
                (nextRect.top !== verseRects[verse]?.top ||
                    nextRect.height !== verseRects[verse]?.height ||
                    nextRect.width !== verseRects[verse]?.width ||
                    nextRect.left !== verseRects[verse]?.left)
            ) {
                updateVerseRect(verse, nextRect)
            }
        }

        window.addEventListener('resize', updateRect)
        window.addEventListener('scroll', updateRect)
        updateRect()
        return () => {
            window.removeEventListener('scroll', updateRect)
            window.removeEventListener('resize', updateRect)
        }
    }, [ref, updateVerseRect, verse, verseRects])

    return verseRects[verse]
}
