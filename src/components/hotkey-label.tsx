'use client'

import clsx from 'clsx'

import { getOS } from '~/app/global-hotkeys'

export default function HotkeyLabel(
    props:
        | {
              mac: string
              nonMac: string
              mobile?: string
              className?: string
          }
        | { value: string; className?: string },
) {
    if ('value' in props) {
        return (
            <kbd
                suppressHydrationWarning
                className={clsx(props.className, 'font-mono tracking-[0.2em]')}
            >
                {props.value}
            </kbd>
        )
    }

    const { os, isMobile } = getOS()

    return (
        <kbd
            suppressHydrationWarning
            className={clsx(props.className, {
                ['font-mono tracking-[0.2em]']: !isMobile,
            })}
        >
            {isMobile && props.mobile
                ? props.mobile
                : os === 'MacOS'
                  ? props.mac
                  : props.nonMac}
        </kbd>
    )
}
