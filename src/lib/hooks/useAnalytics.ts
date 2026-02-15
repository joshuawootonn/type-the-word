"use client"

import { usePostHog } from "posthog-js/react"
import { useCallback } from "react"

type VerseCompletedProperties = {
    book: string
    chapter: number
    verse: number
    translation: string
    assignmentId?: string
}

type AssignmentOpenedProperties = {
    assignmentId: string
    courseId: string
    totalVerses: number
}

type AssignmentCompletedProperties = {
    assignmentId: string
    courseId: string
    totalVerses: number
    completedVerses: number
}

type AssignmentCreatedProperties = {
    assignmentId: string
    courseId: string
    courseWorkId: string
    translation: string
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
    maxPoints: number
    hasDescription: boolean
    hasDueDate: boolean
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
            posthog.capture("verse_completed", properties)
        },
        [posthog],
    )

    const trackThemeCreated = useCallback(
        (properties: ThemeCreatedProperties) => {
            posthog.capture("theme_created", properties)
        },
        [posthog],
    )

    const trackAssignmentOpened = useCallback(
        (properties: AssignmentOpenedProperties) => {
            posthog.capture("assignment_opened", properties)
        },
        [posthog],
    )

    const trackAssignmentCompleted = useCallback(
        (properties: AssignmentCompletedProperties) => {
            posthog.capture("assignment_completed", properties)
        },
        [posthog],
    )

    const trackAssignmentCreated = useCallback(
        (properties: AssignmentCreatedProperties) => {
            posthog.capture("assignment_created", properties)
        },
        [posthog],
    )

    const trackThemeDeleted = useCallback(
        (properties: ThemeDeletedProperties) => {
            posthog.capture("theme_deleted", properties)
        },
        [posthog],
    )

    const trackChangelogViewed = useCallback(() => {
        posthog.capture("changelog_viewed")
    }, [posthog])

    return {
        trackVerseCompleted,
        trackAssignmentOpened,
        trackAssignmentCompleted,
        trackAssignmentCreated,
        trackThemeCreated,
        trackThemeDeleted,
        trackChangelogViewed,
    }
}
