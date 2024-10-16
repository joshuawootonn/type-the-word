'use client'

import { useTheme } from 'next-themes'
import { signIn, signOut, useSession } from 'next-auth/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import * as Select from '@radix-ui/react-select'
import Link from 'next/link'
import Head from 'next/head'
import { usePathname } from 'next/navigation'
import { fetchLastVerse } from '~/lib/api'
import { useQuery } from '@tanstack/react-query'
import { toPassageSegment } from '~/lib/passageSegment'
import { TypedVerse } from '~/server/repositories/typingSession.repository'
import { useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import HotkeyLabel from './hotkey-label'

export function Navigation(props: { lastTypedVerse: TypedVerse | null }) {
    const { data: sessionData } = useSession()
    const isRootPath = usePathname() === '/'
    const RootLinkComponent = isRootPath ? 'h1' : 'span'
    const dropDownTriggerRef = useRef<HTMLButtonElement>(null)
    const { theme, setTheme } = useTheme()
    const [isSettingsOpen, setSettingsOpen] = useState(false)

    useHotkeys(
        'mod+shift+comma',
        () => setSettingsOpen(prev => !prev),
        { enableOnFormTags: true },
        [setSettingsOpen],
    )

    const { data: lastTypedVerse } = useQuery({
        queryKey: ['last-verse'],
        queryFn: fetchLastVerse,
        enabled: sessionData?.user?.id != null,
        initialData: props.lastTypedVerse,
    })

    const rootPathname = lastTypedVerse
        ? `/passage/${toPassageSegment(
              lastTypedVerse.book,
              lastTypedVerse.chapter,
          )}`
        : `/`

    return (
        <nav className="mx-auto mb-2 flex w-full items-center justify-between pt-4 lg:pt-8">
            <Head>
                <link rel="preload" href="/bible.svg" as="image" />
            </Head>
            <style jsx global>{`
                @keyframes bibleAnimation {
                    from {
                        mask-position: 0px 0;
                    }
                    to {
                        mask-position: -741px 0;
                    }
                }

                .icon {
                    display: block;
                    transform: translateY(1px);
                    width: 39px;
                    height: 33px;
                }
                .animated-icon {
                    display: none;
                    transform: translateY(1px);
                    width: 39px;
                    height: 33px;
                    background-color: rgb(var(--color-primary));
                    -webkit-mask-image: url('/bible.svg');
                    mask-image: url('/bible.svg');
                    mask-repeat: no-repeat;
                    mask-position: -741px 0;
                }

                .link:hover .icon,
                .link:focus-visible .icon {
                    display: none;
                }
                .link:hover .animated-icon,
                .link:focus-visible .animated-icon {
                    display: block;
                    animation: bibleAnimation 0.6s steps(20, jump-none) forwards;
                }
            `}</style>
            <Link
                className={
                    'link svg-outline relative flex items-center space-x-1'
                }
                href={rootPathname}
                aria-label={'Type the Word logo'}
            >
                <RootLinkComponent className="text-xl font-semibold">
                    <span className="text-primary/50">Type th</span>
                    <span className="relative text-primary">
                        <span className="absolute -left-[3px] scale-y-125 font-normal">
                            |
                        </span>
                        e Word
                    </span>
                </RootLinkComponent>

                <svg
                    width="39"
                    height="33"
                    viewBox="0 0 39 33"
                    fill="none"
                    className="icon translate-y-[1px] stroke-primary"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M19.7754 5.04895V31.7156M23.6464 6.59934H33.3238M23.6464 10.6303L31.6577 10.6303M23.6464 14.6614H33.3238M23.6464 18.6924L29.8873 18.6924M23.6464 22.4133H33.3238M6.22705 6.59934L13.7748 6.59934M6.22705 10.6303H15.9045M6.22705 14.6614L14.8396 14.6614M6.22705 18.6924H15.9045M6.22705 22.4133L12.5399 22.4133"
                        strokeWidth="2"
                    />
                    <path
                        d="M2.11353 27.5747V1.94971H15.9209C18.2328 1.94971 19.7741 2.88721 19.7741 5.07471C19.7741 2.88721 21.0585 1.94971 23.6273 1.94971H37.1135V27.5747H23.6273C20.7374 27.5747 19.7741 30.3872 19.7741 31.9497C19.7741 30.3872 18.4897 27.5747 15.2787 27.5747H2.11353Z"
                        strokeWidth="2"
                    />
                </svg>

                <div className="animated-icon stroke-primary"></div>
            </Link>
            <div className="flex flex-col gap-4">
                {sessionData ? (
                    <Popover.Root
                        onOpenChange={setSettingsOpen}
                        open={isSettingsOpen}
                    >
                        <DropdownMenu.Root modal={false}>
                            <Popover.PopoverAnchor asChild>
                                <DropdownMenu.Trigger asChild>
                                    <button
                                        ref={dropDownTriggerRef}
                                        className="svg-outline relative border-2 border-primary px-3 py-1 font-medium text-primary"
                                    >
                                        {sessionData.user.name}
                                    </button>
                                </DropdownMenu.Trigger>
                            </Popover.PopoverAnchor>

                            <DropdownMenu.Content
                                className="z-50  border-2 border-primary bg-secondary text-primary "
                                sideOffset={-2}
                                align="end"
                            >
                                <DropdownMenu.Item asChild={true}>
                                    <Link
                                        className="text-medium group flex cursor-pointer items-center px-3 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                        href={'/history'}
                                    >
                                        History
                                        <HotkeyLabel
                                            className="ml-auto pl-5 text-sm text-primary/80 group-focus:text-secondary/80"
                                            mac="⌘+⇧+Y"
                                            nonMac="^+⇧+Y"
                                        />
                                    </Link>
                                </DropdownMenu.Item>
                                <Popover.PopoverTrigger asChild>
                                    <DropdownMenu.Item className="text-medium group flex cursor-pointer items-center px-3 py-1 no-underline outline-none focus:bg-primary focus:text-secondary ">
                                        Settings
                                        <HotkeyLabel
                                            className="ml-auto pl-5 text-sm text-primary/80 group-focus:text-secondary/80"
                                            mac="⌘+⇧+,"
                                            nonMac="^+⇧+,"
                                        />
                                    </DropdownMenu.Item>
                                </Popover.PopoverTrigger>
                                <DropdownMenu.Item
                                    className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                    onClick={() =>
                                        void signOut({ redirect: true })
                                    }
                                >
                                    Sign out
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                            <Popover.PopoverContent
                                className="z-50 w-52 border-2 border-primary bg-secondary px-3 py-3 text-primary"
                                sideOffset={-2}
                                align="end"
                                onCloseAutoFocus={e => {
                                    e.preventDefault()
                                    dropDownTriggerRef.current?.focus()
                                }}
                            >
                                <h2 className="mb-2 text-xl">Settings</h2>
                                <div className="flex flex-row items-center justify-between">
                                    <label
                                        htmlFor="theme-selector"
                                        className="pr-4"
                                    >
                                        Theme:
                                    </label>

                                    <Select.Root
                                        value={theme}
                                        onValueChange={next => setTheme(next)}
                                    >
                                        <Select.Trigger
                                            id="theme-selector"
                                            className="svg-outline relative h-full cursor-pointer border-2 border-primary px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                        >
                                            <Select.Value />
                                        </Select.Trigger>

                                        <Select.Portal>
                                            <Select.Content
                                                side="bottom"
                                                position="popper"
                                                avoidCollisions={false}
                                                className="z-50 border-2 border-primary bg-secondary text-primary "
                                                align="end"
                                                sideOffset={-2}
                                            >
                                                <Select.ScrollUpButton />
                                                <Select.Viewport>
                                                    <Select.Item
                                                        className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                        value="dark"
                                                    >
                                                        <Select.ItemText>
                                                            Dark
                                                        </Select.ItemText>
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                    <Select.Item
                                                        className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                        value="light"
                                                    >
                                                        <Select.ItemText>
                                                            Light
                                                        </Select.ItemText>
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                    <Select.Item
                                                        className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                        value="system"
                                                    >
                                                        <Select.ItemText>
                                                            System
                                                        </Select.ItemText>
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                </Select.Viewport>
                                            </Select.Content>
                                        </Select.Portal>
                                    </Select.Root>
                                </div>
                            </Popover.PopoverContent>
                        </DropdownMenu.Root>
                    </Popover.Root>
                ) : (
                    <button
                        className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary "
                        onClick={() => void signIn()}
                    >
                        Sign in
                    </button>
                )}
            </div>
        </nav>
    )
}
