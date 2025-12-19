/**
 * Feature flag keys used throughout the application.
 * These must match the feature flag keys in PostHog.
 */
export const FeatureFlags = {
    /** Show WPM and accuracy chart in history page */
    WPM_ACCURACY_CHART: 'use-wpm-accuracy-history-chart',
    /** Use read-optimized history data */
    READ_OPTIMIZED_HISTORY: 'use-read-optimized-history',
    /** Enable API.Bible translations (BSB, NLT, NIV, CSB, NKJV, NASB, NTV, MSG) */
    API_BIBLE_TRANSLATIONS: 'use-api-bible-translations',
} as const

export type FeatureFlagKey = (typeof FeatureFlags)[keyof typeof FeatureFlags]
