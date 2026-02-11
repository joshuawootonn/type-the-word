"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"

import { cn } from "~/lib/cn"

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                className={cn(
                    "svg-outline peer border-1.5 border-primary relative z-0 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border-transparent shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    checked ? "bg-primary" : "bg-secondary",
                    className,
                )}
                onClick={() => onCheckedChange?.(!checked)}
                ref={ref}
                {...props}
            >
                <span
                    className={cn(
                        "border-1.5 border-primary bg-secondary ring-primary pointer-events-none block h-[22px] w-[22px] shadow-lg ring-0 transition-transform",
                        checked ? "translate-x-[13px]" : "translate-x-[-2px]",
                    )}
                />
            </button>
        )
    },
)

Switch.displayName = "Switch"
