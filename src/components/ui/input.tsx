"use client"

import clsx from "clsx"
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from "react"

const Input = forwardRef<
    ElementRef<"input">,
    ComponentPropsWithoutRef<"input">
>(({ className, ...props }, ref) => (
    <div className="svg-outline group relative">
        <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
        <input
            ref={ref}
            className={clsx(
                "border-primary bg-secondary w-full border-2 px-3 py-2 outline-hidden",
                className,
            )}
            {...props}
        />
    </div>
))
Input.displayName = "Input"

const Textarea = forwardRef<
    ElementRef<"textarea">,
    ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => (
    <div className="svg-outline group relative">
        <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
        <textarea
            ref={ref}
            className={clsx(
                "border-primary bg-secondary w-full border-2 px-3 py-2 outline-hidden",
                className,
            )}
            {...props}
        />
    </div>
))
Textarea.displayName = "Textarea"

export { Input, Textarea }
