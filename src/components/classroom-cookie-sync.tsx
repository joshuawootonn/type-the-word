"use client"

import { useSession } from "next-auth/react"
import { useEffect, useRef } from "react"

/**
 * Client component that syncs classroom cookies based on database tokens
 * Makes a request to the sync API route on mount
 */
export function ClassroomCookieSync() {
    const { status } = useSession()
    const hasSynced = useRef(false)

    useEffect(() => {
        if (status === "authenticated" && !hasSynced.current) {
            hasSynced.current = true

            fetch("/api/classroom/sync-cookies", {
                method: "POST",
            }).catch(() => {
                // Silently fail - cookies will be set on next classroom connection
            })
        }
    }, [status])

    return null
}
