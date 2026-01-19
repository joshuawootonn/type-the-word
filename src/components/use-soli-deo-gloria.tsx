import { useEffect, useRef } from "react"

export function useSoliDeoGloria() {
    const hasLogged = useRef(false)

    useEffect(() => {
        if (hasLogged.current) return

        hasLogged.current = true
        console.log(`


    Soli Deo Gloria


    `)
    }, [])

    return null
}
