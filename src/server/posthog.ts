import { PostHog } from "posthog-node"

import { env } from "~/env.mjs"
import { FeatureFlagKey } from "~/lib/feature-flags"

type PostHogFeatureFlagClient = {
    isFeatureEnabled: (flag: string, distinctId: string) => Promise<boolean>
}

function createMockPostHogClient(): PostHogFeatureFlagClient {
    const enabledFlags = new Set(
        (process.env.E2E_MOCK_POSTHOG_ENABLED_FLAGS ?? "")
            .split(",")
            .map(flag => flag.trim())
            .filter(Boolean),
    )

    return {
        async isFeatureEnabled(flag: string) {
            return enabledFlags.has(flag as FeatureFlagKey)
        },
    }
}

// NOTE: This is a Node.js client, so you can use it for sending events from the server side to PostHog.
export default function PostHogClient() {
    if (process.env.E2E_MOCK_POSTHOG === "1") {
        return createMockPostHogClient()
    }

    const posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
        host: env.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
    })
    return posthogClient
}
