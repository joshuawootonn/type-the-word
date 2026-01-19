"use client"

import { useFeatureFlagEnabled } from "posthog-js/react"

import { FeatureFlagKey } from "~/lib/feature-flags"

/**
 * Hook to check if a feature flag is enabled for the current user.
 *
 * @param flag - The feature flag key to check
 * @returns boolean | undefined - true if enabled, false if disabled, undefined if loading
 *
 * @example
 * ```tsx
 * import { FeatureFlags } from '~/lib/feature-flags'
 * import { useFeatureFlag } from '~/lib/hooks/use-feature-flag'
 *
 * function MyComponent() {
 *     const showWpmChart = useFeatureFlag(FeatureFlags.WPM_ACCURACY_CHART)
 *
 *     if (showWpmChart === undefined) {
 *         return <Loading />
 *     }
 *
 *     if (showWpmChart) {
 *         return <WpmChart />
 *     }
 *
 *     return null
 * }
 * ```
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean | undefined {
    return useFeatureFlagEnabled(flag)
}
