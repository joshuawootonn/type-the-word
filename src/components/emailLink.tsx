'use client'

import clsx from 'clsx'

import * as Popover from '@radix-ui/react-popover'
import { forwardRef, useEffect, useState } from 'react'

export const EmailLink = forwardRef(function EmailLink(
    {
        children,
        className,
        popoverClassName,
    }: {
        children?: string
        className?: string
        popoverClassName?: string
    },
    ref: any,
) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => {
                setIsOpen(false)
            }, 2000)

            return () => {
                clearTimeout(t)
            }
        }
    }, [isOpen])

    return (
        <Popover.Root open={isOpen}>
            <Popover.Trigger asChild>
                <button
                    ref={ref}
                    tabIndex={0}
                    className={clsx('relative z-[5] font-medium', className)}
                    onClick={e => {
                        setIsOpen(true)
                        const el = document.createElement('textarea')
                        el.value = 'joshuawootonn@gmail.com'
                        document.body.appendChild(el)
                        el.select()
                        document.execCommand('copy')
                        document.body.removeChild(el)
                    }}
                >
                    {children ?? 'josh@typetheword.site'}
                </button>
            </Popover.Trigger>
            <Popover.Content
                side={'top'}
                className="PopoverContent"
                align={'center'}
                sideOffset={5}
            >
                <span
                    className={clsx(
                        'block border-2 border-primary bg-secondary px-2 py-1 font-medium outline-none',
                        popoverClassName,
                    )}
                >
                    Copied
                </span>

                <Popover.Arrow className="PopoverArrow dark:fill-secondary" />
            </Popover.Content>
        </Popover.Root>
    )
})
