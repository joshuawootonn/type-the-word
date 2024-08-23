'use client'

import clsx from 'clsx'
import { getOS } from '~/app/global-hotkeys'

export default function HotkeyLabel({
    mac,
    nonMac,
    mobile,
    className,
}: {
    mac: string
    nonMac: string
    mobile?: string
    className?: string
}) {
    const { os, isMobile } = getOS()

    return (
        <kbd
            suppressHydrationWarning
            className={clsx(className, {
                ['font-sans tracking-[0.2em]']: !isMobile,
            })}
        >
            {isMobile && mobile ? mobile : os === 'MacOS' ? mac : nonMac}
        </kbd>
    )
}
