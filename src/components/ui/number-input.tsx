"use client"

import { NumberField } from "@base-ui/react/number-field"
import { Minus, Plus } from "@phosphor-icons/react"

import { cn } from "~/lib/cn"

interface NumberInputProps {
    id: string
    value: number
    onValueChange: (value: number) => void
    label: string
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
    min,
    max,
    step = 1,
    required,
    disabled,
    className,
}: NumberInputProps) {
    return (
        <NumberField.Root
            id={id}
            value={value}
            min={min}
            max={max}
            step={step}
            required={required}
            disabled={disabled}
            className={cn("w-full", className)}
            onValueChange={nextValue => {
                if (nextValue == null) {
                    onValueChange(clamp(value, min, max))
                    return
                }

                onValueChange(clamp(Math.trunc(nextValue), min, max))
            }}
        >
            <NumberField.ScrubArea className="mb-2 inline-flex cursor-ew-resize select-none">
                <label htmlFor={id} className="block cursor-ew-resize">
                    {label}
                </label>
            </NumberField.ScrubArea>
            <div className="svg-outline group relative">
                <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
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
            </div>
        </NumberField.Root>
    )
}
