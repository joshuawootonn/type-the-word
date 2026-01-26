"use client"

import { Meter as BaseMeter } from "@base-ui/react/meter"

interface MeterProps {
    value: number
    label: string
    className?: string
}

export function Meter({ value, label, className }: MeterProps) {
    return (
        <BaseMeter.Root value={value} className={className}>
            <div className="mb-1 flex items-center justify-between text-sm">
                <BaseMeter.Label>{label}</BaseMeter.Label>
                <BaseMeter.Value />
            </div>
            <BaseMeter.Track className="h-3 border-2 border-primary bg-secondary">
                <BaseMeter.Indicator
                    className="!h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{
                        width: `${value}%`,
                    }}
                />
            </BaseMeter.Track>
        </BaseMeter.Root>
    )
}
