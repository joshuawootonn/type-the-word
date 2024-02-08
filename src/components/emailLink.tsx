import clsx from 'clsx'

import * as Popover from '@radix-ui/react-popover'
import { useEffect, useState } from 'react'

export function EmailLink({
    children,
    className,
    popoverClassName,
}: {
    children?: string
    className?: string
    popoverClassName?: string
}) {
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
                    {children ?? 'joshuawootonn@gmail.com'}
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
                        'block border-2 border-black bg-white px-2 py-1 font-medium outline-none dark:border-white dark:bg-black',
                        popoverClassName,
                    )}
                >
                    Copied
                </span>

                <Popover.Arrow className="PopoverArrow dark:fill-white" />
            </Popover.Content>
        </Popover.Root>
    )
}
