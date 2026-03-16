"use client"

import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu"
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react"

import { cn } from "~/lib/cn"

function mergeClassName<State>(
    defaultClassName: string,
    className?: string | ((state: State) => string | undefined),
): string | ((state: State) => string) {
    if (typeof className === "function") {
        return state => cn(defaultClassName, className(state))
    }

    return cn(defaultClassName, className)
}

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuTrigger = forwardRef<
    ElementRef<typeof DropdownMenuPrimitive.Trigger>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Trigger
        ref={ref}
        className={mergeClassName("", className)}
        {...props}
    />
))
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuPositioner = forwardRef<
    ElementRef<typeof DropdownMenuPrimitive.Positioner>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Positioner>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Positioner
        ref={ref}
        sideOffset={sideOffset}
        className={mergeClassName("z-50 outline-hidden", className)}
        {...props}
    />
))
DropdownMenuPositioner.displayName = "DropdownMenuPositioner"

const DropdownMenuContent = forwardRef<
    ElementRef<typeof DropdownMenuPrimitive.Popup>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Popup
        ref={ref}
        className={mergeClassName(
            "border-primary bg-secondary text-primary border-2",
            className,
        )}
        {...props}
    />
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = forwardRef<
    ElementRef<typeof DropdownMenuPrimitive.Item>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={mergeClassName(
            "focus:bg-primary focus:text-secondary data-highlighted:bg-primary data-highlighted:text-secondary cursor-pointer px-3 py-1 outline-hidden data-disabled:cursor-not-allowed data-disabled:opacity-75",
            className,
        )}
        {...props}
    />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = forwardRef<
    ElementRef<typeof DropdownMenuPrimitive.Separator>,
    ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={mergeClassName("border-primary border-t-2", className)}
        {...props}
    />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuPositioner,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
}
