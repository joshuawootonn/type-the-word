"use client"

import clsx from "clsx"
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from "react"

const Label = forwardRef<
    ElementRef<"label">,
    ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={clsx("mb-2 block text-sm", className)}
        {...props}
    />
))
Label.displayName = "Label"

export { Label }
