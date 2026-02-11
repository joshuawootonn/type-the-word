"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import clsx from "clsx"
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from "react"

import { cn } from "~/lib/cn"

const Tabs = TabsPrimitive.Root

const TabsList = forwardRef<
    ElementRef<typeof TabsPrimitive.List>,
    ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={clsx(
            "border-primary relative flex gap-1 border-b-2",
            className,
        )}
        {...props}
    >
        {children}
    </TabsPrimitive.List>
))
TabsList.displayName = "TabsList"

const TabsTab = forwardRef<
    ElementRef<typeof TabsPrimitive.Tab>,
    ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(function TabsTab({ className, children, ...props }, ref) {
    return (
        <TabsPrimitive.Tab
            ref={ref}
            className={clsx(
                "flex cursor-pointer",
                "group",
                "svg-outline relative outline-hidden",
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    "text-primary px-4 py-2",
                    "group-aria-selected:bg-secondary group-aria-selected:invert",
                )}
            >
                {children}
            </div>
        </TabsPrimitive.Tab>
    )
})

const TabsPanel = forwardRef<
    ElementRef<typeof TabsPrimitive.Panel>,
    ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, children, ...props }, ref) => (
    <TabsPrimitive.Panel
        ref={ref}
        className={clsx("pt-4 outline-hidden", className)}
        {...props}
    >
        {children}
    </TabsPrimitive.Panel>
))
TabsPanel.displayName = "TabsPanel"

export { Tabs, TabsList, TabsTab, TabsPanel }
