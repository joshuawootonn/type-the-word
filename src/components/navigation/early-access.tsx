'use client'

import { Loading } from '~/components/loading'
import { Switch } from '~/components/ui/switch'
import { useEarlyAccessFeatures } from '~/lib/hooks/use-early-access-features'

export function EarlyAccess() {
    const { earlyAccessFeatures, isLoading, toggleFeature, isFeatureEnabled } =
        useEarlyAccessFeatures()

    if (isLoading) {
        return <Loading className="text-sm" initialDots={1} />
    }

    if (earlyAccessFeatures.length > 0) {
        return (
            <>
                {earlyAccessFeatures
                    .filter(feature => feature.flagKey !== null)
                    .map(feature => (
                        <div
                            key={feature.flagKey}
                            className="flex flex-row items-center justify-between gap-4"
                        >
                            <div className="flex flex-col">
                                <label
                                    htmlFor={`early-access-${feature.flagKey}`}
                                    className="cursor-pointer"
                                >
                                    {feature.name}
                                </label>
                                {feature.description && (
                                    <span className="text-xs text-primary/60">
                                        {feature.description}
                                    </span>
                                )}
                            </div>
                            <Switch
                                id={`early-access-${feature.flagKey}`}
                                checked={isFeatureEnabled(feature.flagKey!)}
                                onCheckedChange={() =>
                                    toggleFeature(feature.flagKey!)
                                }
                            />
                        </div>
                    ))}
            </>
        )
    }

    return (
        <p className="text-sm text-primary/60">
            There are currently no early access features available.
        </p>
    )
}
