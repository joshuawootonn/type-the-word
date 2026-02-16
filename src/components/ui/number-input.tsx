"use client"

import { NumberField } from "@base-ui/react/number-field"
import { ArrowsHorizontal, Minus, Plus } from "@phosphor-icons/react"

import { cn } from "~/lib/cn"

interface NumberInputProps {
    id: string
    value: number
    onValueChange: (value: number) => void
    label: string
    scrubLabel?: string
    min?: number
    max?: number
    step?: number
    required?: boolean
    disabled?: boolean
    className?: string
}

function clamp(value: number, min?: number, max?: number): number {
    if (min != null && value < min) {
        return min
    }

    if (max != null && value > max) {
        return max
    }

    return value
}

export function NumberInput({
    id,
    value,
    onValueChange,
    label,
    scrubLabel,
    min,
    max,
    step = 1,
    required,
    disabled,
    className,
}: NumberInputProps) {
    return (
        <div className={cn("svg-outline group relative", className)}>
            <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
            <NumberField.Root
                id={id}
                value={value}
                min={min}
                max={max}
                step={step}
                required={required}
                disabled={disabled}
                onValueChange={nextValue => {
                    if (nextValue == null) {
                        onValueChange(clamp(value, min, max))
                        return
                    }

                    onValueChange(clamp(Math.trunc(nextValue), min, max))
                }}
            >
                <NumberField.ScrubArea className="border-primary bg-secondary text-primary/70 flex cursor-ew-resize items-center justify-center gap-1 border-x-2 border-t-2 px-2 py-1 text-[11px] leading-none select-none">
                    <ArrowsHorizontal aria-hidden size={12} weight="bold" />
                    <label htmlFor={id} className="cursor-ew-resize">
                        {scrubLabel ?? `Drag to change ${label}`}
                    </label>
                </NumberField.ScrubArea>
                <NumberField.Group className="border-primary bg-secondary text-primary flex items-stretch border-2">
                    <NumberField.Decrement
                        type="button"
                        aria-label={`Decrease ${label}`}
                        title={`Decrease ${label}`}
                        className="border-primary hover:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center border-r-2 outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Minus aria-hidden size={14} weight="bold" />
                    </NumberField.Decrement>
                    <NumberField.Input className="bg-secondary text-primary h-10 w-full min-w-0 px-2 text-center font-medium outline-hidden" />
                    <NumberField.Increment
                        type="button"
                        aria-label={`Increase ${label}`}
                        title={`Increase ${label}`}
                        className="border-primary hover:bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center border-l-2 outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus aria-hidden size={14} weight="bold" />
                    </NumberField.Increment>
                </NumberField.Group>
            </NumberField.Root>
        </div>
    )
}
