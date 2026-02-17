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
    preventEnterSubmit?: boolean
    inputSize?: "default" | "compact"
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
    preventEnterSubmit = false,
    inputSize = "default",
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
            <NumberField.ScrubArea
                className={cn(
                    "inline-flex cursor-ew-resize select-none",
                    inputSize === "compact" ? "mb-1 text-sm" : "mb-2",
                )}
            >
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
                        className={cn(
                            "border-primary bg-secondary flex shrink-0 cursor-pointer items-center justify-center border-r-2 outline-hidden disabled:cursor-not-allowed",
                            inputSize === "compact" ? "h-8 w-8" : "h-10 w-10",
                        )}
                    >
                        <Minus
                            aria-hidden
                            size={inputSize === "compact" ? 12 : 14}
                            weight="bold"
                        />
                    </NumberField.Decrement>
                    <NumberField.Input
                        className={cn(
                            "bg-secondary text-primary w-full min-w-0 text-center font-medium outline-hidden",
                            inputSize === "compact"
                                ? "h-8 px-1 text-sm"
                                : "h-10 px-2",
                        )}
                        onKeyDown={event => {
                            if (preventEnterSubmit && event.key === "Enter") {
                                event.preventDefault()
                            }
                        }}
                    />
                    <NumberField.Increment
                        type="button"
                        aria-label={`Increase ${label}`}
                        title={`Increase ${label}`}
                        className={cn(
                            "border-primary bg-secondary flex shrink-0 cursor-pointer items-center justify-center border-l-2 outline-hidden disabled:cursor-not-allowed",
                            inputSize === "compact" ? "h-8 w-8" : "h-10 w-10",
                        )}
                    >
                        <Plus
                            aria-hidden
                            size={inputSize === "compact" ? 12 : 14}
                            weight="bold"
                        />
                    </NumberField.Increment>
                </NumberField.Group>
            </div>
        </NumberField.Root>
    )
}
