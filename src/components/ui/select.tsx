'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import clsx from 'clsx'
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from 'react'

const Select = SelectPrimitive.Root

const SelectValue = SelectPrimitive.Value

const SelectTrigger = forwardRef<
    ElementRef<typeof SelectPrimitive.Trigger>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={clsx(
            'flex items-center justify-between gap-2 border-2 border-primary bg-secondary px-2 py-1 text-primary outline-none focus:bg-primary focus:text-secondary',
            className,
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                className="shrink-0"
            >
                <path d="M6 8L1 3h10z" />
            </svg>
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = forwardRef<
    ElementRef<typeof SelectPrimitive.Content>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={clsx(
                'z-50 border-2 border-primary bg-secondary text-primary',
                position === 'popper' && 'max-h-96',
                className,
            )}
            position={position}
            sideOffset={-2}
            {...props}
        >
            <SelectPrimitive.Viewport
                className={clsx(
                    position === 'popper' &&
                        'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
                )}
            >
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = forwardRef<
    ElementRef<typeof SelectPrimitive.Item>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={clsx(
            'cursor-pointer px-3 py-1 outline-none focus:bg-primary focus:text-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem }
