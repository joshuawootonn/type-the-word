'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import clsx from 'clsx'
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from 'react'

import { cn } from '~/lib/cn'

const Tabs = TabsPrimitive.Root

const TabsList = forwardRef<
    ElementRef<typeof TabsPrimitive.List>,
    ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={clsx(
            'relative flex gap-1 border-b-2 border-primary',
            className,
        )}
        {...props}
    >
        {children}
    </TabsPrimitive.List>
))
TabsList.displayName = 'TabsList'

const TabsTab = forwardRef<
    ElementRef<typeof TabsPrimitive.Tab>,
    ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(function TabsTab({ className, children, ...props }, ref) {
    return (
        <TabsPrimitive.Tab
            ref={ref}
            className={clsx(
                'flex  cursor-pointer',
                'group',
                'svg-outline relative outline-none',
                className,
            )}
            {...props}
        >
            <div
                className={cn(
                    'px-4 py-2 text-primary',
                    "group-aria-[selected='true']:bg-secondary group-aria-[selected='true']:invert",
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
        className={clsx('pt-4 outline-none', className)}
        {...props}
    >
        {children}
    </TabsPrimitive.Panel>
))
TabsPanel.displayName = 'TabsPanel'

export { Tabs, TabsList, TabsTab, TabsPanel }
