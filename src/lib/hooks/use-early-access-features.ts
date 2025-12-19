'use client'

import { EarlyAccessFeature } from 'posthog-js'
import { usePostHog, useActiveFeatureFlags } from 'posthog-js/react'
import { useCallback, useEffect, useState } from 'react'

import { FeatureFlags } from '~/lib/feature-flags'

export type { EarlyAccessFeature }

/**
 * Hook to manage early access features.
 * Allows users to opt in/out of early access features.
 *
 * @see https://posthog.com/docs/feature-flags/early-access-feature-management
 */
export function useEarlyAccessFeatures() {
    const posthog = usePostHog()
    const activeFlags = useActiveFeatureFlags()

    const [earlyAccessFeatures, setEarlyAccessFeatures] = useState<
        EarlyAccessFeature[]
    >([])
    const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(
        new Set(),
    )
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        posthog.getEarlyAccessFeatures(
            features => {
                // Filter to only show early access features with valid flagKeys
                const earlyAccessFeatures = features.filter(
                    feature => feature.stage === 'beta' && feature.flagKey,
                )
                setEarlyAccessFeatures(earlyAccessFeatures)

                // Determine which features are currently enabled
                const enabled = new Set<string>()
                if (activeFlags && activeFlags.length > 0) {
                    earlyAccessFeatures.forEach(earlyAccessFeature => {
                        if (
                            earlyAccessFeature.flagKey &&
                            activeFlags.includes(earlyAccessFeature.flagKey)
                        ) {
                            enabled.add(earlyAccessFeature.flagKey)
                        }
                    })
                }
                setEnabledFeatures(enabled)
                setIsLoading(false)
            },
            true, // force_reload to get latest
            ['beta'],
        )
    }, [posthog, activeFlags])

    const toggleFeature = useCallback(
        (flagKey: string) => {
            const isCurrentlyEnabled = enabledFeatures.has(flagKey)
            const newValue = !isCurrentlyEnabled

            // Optimistically update UI
            setEnabledFeatures(prev => {
                const next = new Set(prev)
                if (newValue) {
                    next.add(flagKey)
                } else {
                    next.delete(flagKey)
                }
                return next
            })

            // Update in PostHog
            posthog.updateEarlyAccessFeatureEnrollment(flagKey, newValue)
        },
        [posthog, enabledFeatures],
    )

    const isFeatureEnabled = useCallback(
        (flagKey: string) => enabledFeatures.has(flagKey),
        [enabledFeatures],
    )

    return {
        earlyAccessFeatures,
        isLoading,
        toggleFeature,
        isFeatureEnabled,
    }
}

/**
 * Descriptions for known early access features.
 * Used to provide user-friendly descriptions in the UI.
 */
export const BETA_FEATURE_DESCRIPTIONS: Record<string, string> = {
    [FeatureFlags.WPM_ACCURACY_CHART]:
        'Track your typing speed (WPM) and accuracy over time with detailed charts.',
}
