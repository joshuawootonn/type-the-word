import { useEffect } from "react"

export function useTimezoneOffsetCookie() {
    useEffect(() => {
        document.cookie = `timezoneOffset=${new Date().getTimezoneOffset()}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`
    }, [])

    return null
}
