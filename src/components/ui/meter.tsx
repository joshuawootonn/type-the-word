"use client"

import { Meter as BaseMeter } from "@base-ui/react/meter"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

type MeterVariant = "stacked" | "inline"

type MeterBaseProps = {
    label: string
    className?: string
    variant?: MeterVariant
}

type PercentageMeterProps = MeterBaseProps & {
    type?: "percentage"
    value: number
    total?: never
}

type FractionalMeterProps = MeterBaseProps & {
    type: "fractional"
    value: number
    total: number
}

type MeterProps = PercentageMeterProps | FractionalMeterProps

export function Meter({
    type,
    value,
    total,
    label,
    className,
    variant = "stacked",
}: MeterProps) {
    const meterType = type ?? "percentage"
    const fractionalTotal = meterType === "fractional" ? (total ?? 0) : 0
    const percentage =
        meterType === "fractional"
            ? fractionalTotal > 0
                ? (value / fractionalTotal) * 100
                : 0
            : value
    const roundedPercentage = Math.round(percentage)
    const valueText =
        meterType === "fractional"
            ? `${value}/${fractionalTotal}`
            : `${roundedPercentage}%`
    const tooltipText =
        meterType === "fractional"
            ? `${label}: ${valueText} (${roundedPercentage}%)`
            : `${label}: ${roundedPercentage}%`

    if (variant === "inline") {
        return (
            <BaseMeter.Root value={percentage} className={className}>
                <div className="flex items-center justify-between gap-2 text-sm">
                    <BaseMeter.Label className="sr-only">
                        {label}
                    </BaseMeter.Label>
                    <Tooltip>
                        <TooltipTrigger
                            render={<div className="grow" />}
                            aria-label={tooltipText}
                        >
                            <BaseMeter.Track className="border-primary bg-secondary h-3 grow border-2">
                                <BaseMeter.Indicator
                                    className="bg-primary h-full! transition-all duration-200 ease-in-out"
                                    style={{
                                        width: `${percentage}%`,
                                    }}
                                />
                            </BaseMeter.Track>
                        </TooltipTrigger>
                        <TooltipContent>{tooltipText}</TooltipContent>
                    </Tooltip>
                </div>
            </BaseMeter.Root>
        )
    }

    return (
        <BaseMeter.Root value={percentage} className={className}>
            <div className="mb-1 flex items-center justify-between text-sm">
                <BaseMeter.Label>{label}</BaseMeter.Label>
                <div className="flex items-center gap-2">
                    {meterType === "fractional" ? (
                        <span className="tabular-nums">{valueText}</span>
                    ) : (
                        <span className="tabular-nums">
                            {roundedPercentage}%
                        </span>
                    )}
                </div>
            </div>
            <BaseMeter.Track className="border-primary bg-secondary h-3 border-2">
                <BaseMeter.Indicator
                    className="bg-primary h-full! transition-all duration-200 ease-in-out"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </BaseMeter.Track>
        </BaseMeter.Root>
    )
}
