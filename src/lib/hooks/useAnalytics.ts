'use client'

import { usePostHog } from 'posthog-js/react'
import { useCallback } from 'react'

type VerseCompletedProperties = {
    book: string
    chapter: number
    verse: number
    translation: string
}

type ThemeCreatedProperties = {
    theme_name: string
}

type ThemeDeletedProperties = {
    theme_name: string
}

export function useAnalytics() {
    const posthog = usePostHog()

    const trackVerseCompleted = useCallback(
        (properties: VerseCompletedProperties) => {
            posthog.capture('verse_completed', properties)
        },
        [posthog],
    )

    const trackThemeCreated = useCallback(
        (properties: ThemeCreatedProperties) => {
            posthog.capture('theme_created', properties)
        },
        [posthog],
    )

    const trackThemeDeleted = useCallback(
        (properties: ThemeDeletedProperties) => {
            posthog.capture('theme_deleted', properties)
        },
        [posthog],
    )

    const trackChangelogViewed = useCallback(() => {
        posthog.capture('changelog_viewed')
    }, [posthog])

    return {
        trackVerseCompleted,
        trackThemeCreated,
        trackThemeDeleted,
        trackChangelogViewed,
    }
}

