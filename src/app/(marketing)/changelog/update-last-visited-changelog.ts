'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAnalytics } from '~/lib/hooks/useAnalytics'

export function UpdateLastVisitedChangelog() {
    const queryClient = useQueryClient()
    const { trackChangelogViewed } = useAnalytics()
    const { mutate } = useMutation(
        async () => {
            const response = await fetch('/api/user-changelog', {
                method: 'POST',
                body: JSON.stringify({ lastVisitedAt: new Date() }),
            })
            if (!response.ok) {
                throw new Error('Failed to update last visited changelog')
            }
            return response.json()
        },
        {
            onSuccess: () => {
                trackChangelogViewed()
                void queryClient.invalidateQueries(['user-changelog'])
            },
        },
    )

    useEffect(() => void mutate(), [mutate])

    return null
}
