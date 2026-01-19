"use client"

import { load, trackPageview } from "fathom-client"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

import { env } from "~/env.mjs"

function TrackPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Load the Fathom script on mount
    useEffect(() => {
        load(env.NEXT_PUBLIC_FATHOM_ID, {
            auto: false,

            // includedDomains: ['www.typetheword.site', 'typetheword.site'],
        })
    }, [])

    // Record a pageview when route changes
    useEffect(() => {
        if (!pathname) return

        trackPageview({
            url: pathname + searchParams?.toString(),
            referrer: document.referrer,
        })
    }, [pathname, searchParams])

    return null
}

export default function Fathom() {
    return (
        <Suspense fallback={null}>
            <TrackPageView />
        </Suspense>
    )
}
