"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import clsx from "clsx"
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react"

const Combobox = ComboboxPrimitive.Root

const ComboboxInput = forwardRef<
    ElementRef<typeof ComboboxPrimitive.Input>,
    ComponentPropsWithoutRef<typeof ComboboxPrimitive.Input>
>(({ className, ...props }, ref) => (
    <div className="svg-outline group relative">
        <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
        <ComboboxPrimitive.Input
            ref={ref}
            className={clsx(
                "border-primary bg-secondary w-full border-2 px-3 py-2 text-base outline-hidden",
                className,
            )}
            {...props}
        />
    </div>
))
ComboboxInput.displayName = "ComboboxInput"

const ComboboxPositioner = forwardRef<
    ElementRef<typeof ComboboxPrimitive.Positioner>,
    ComponentPropsWithoutRef<typeof ComboboxPrimitive.Positioner>
>(({ className, ...props }, ref) => (
    <ComboboxPrimitive.Positioner
        ref={ref}
        className={clsx("z-50", className)}
        {...props}
    />
))
ComboboxPositioner.displayName = "ComboboxPositioner"

const ComboboxPopup = forwardRef<
    ElementRef<typeof ComboboxPrimitive.Popup>,
    ComponentPropsWithoutRef<typeof ComboboxPrimitive.Popup>
>(({ className, ...props }, ref) => (
    <ComboboxPrimitive.Popup
        ref={ref}
        className={clsx(
            "border-primary bg-secondary text-primary max-h-64 w-(--anchor-width) overflow-y-auto border-2",
            className,
        )}
        {...props}
    />
))
ComboboxPopup.displayName = "ComboboxPopup"

const ComboboxList = forwardRef<
    ElementRef<typeof ComboboxPrimitive.List>,
    ComponentPropsWithoutRef<typeof ComboboxPrimitive.List>
>(({ className, ...props }, ref) => (
    <ComboboxPrimitive.List ref={ref} className={clsx(className)} {...props} />
))
ComboboxList.displayName = "ComboboxList"

const ComboboxItem = forwardRef<
    ElementRef<typeof ComboboxPrimitive.Item>,
    ComponentPropsWithoutRef<typeof ComboboxPrimitive.Item>
>(({ className, ...props }, ref) => (
    <ComboboxPrimitive.Item
        ref={ref}
        className={clsx(
            "data-highlighted:bg-primary data-highlighted:text-secondary cursor-pointer px-2 py-1 text-sm outline-hidden data-disabled:pointer-events-none data-selected:font-semibold",
            className,
        )}
        {...props}
    />
))
ComboboxItem.displayName = "ComboboxItem"

const ComboboxEmpty = forwardRef<
    ElementRef<typeof ComboboxPrimitive.Empty>,
    ComponentPropsWithoutRef<typeof ComboboxPrimitive.Empty>
>(({ className, ...props }, ref) => (
    <ComboboxPrimitive.Empty
        ref={ref}
        className={clsx("px-2 py-1 text-sm empty:py-0", className)}
        {...props}
    />
))
ComboboxEmpty.displayName = "ComboboxEmpty"

const ComboboxPortal = ComboboxPrimitive.Portal

export {
    Combobox,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxPopup,
    ComboboxPortal,
    ComboboxPositioner,
}
