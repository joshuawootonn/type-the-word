'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import Head from 'next/head'
import { usePathname } from 'next/navigation'

export function Navigation() {
    const { data: sessionData } = useSession()
    const isRootPath = usePathname() === '/'
    const RootLinkComponent = isRootPath ? 'h1' : 'span'

    return (
        <nav className="mx-auto mb-2 flex w-full items-center justify-between pt-4 lg:pt-8">
            <Head>
                <link rel="preload" href="/bible.svg" as="image" />
            </Head>
            <style jsx global>{`
                @keyframes bibleAnimation {
                    from {
                        background-position: 0px 0;
                    }
                    to {
                        background-position: -741px 0;
                    }
                }

                .icon {
                    transform: translateY(1px);
                    width: 39px;
                    height: 33px;
                    background-image: url('/bible.svg');
                    background-repeat: no-repeat;
                    background-position: -741px 0;
                }
                .link {
                }

                .link:hover .icon,
                .link:focus-visible .icon {
                    animation: bibleAnimation 0.6s steps(20, jump-none) forwards;
                }

                @media (prefers-color-scheme: dark) {
                    .icon {
                        filter: invert(100%);
                    }
                }
            `}</style>
            <Link
                className={
                    'link svg-outline relative flex items-center space-x-1'
                }
                href={'/'}
                aria-label={'Type the Word logo'}
            >
                <RootLinkComponent className="text-xl font-semibold">
                    <span className="text-gray-500 dark:text-gray-400">
                        Type th
                    </span>
                    <span className="relative text-black dark:text-white">
                        <span className="absolute -left-[3px] scale-y-125 font-normal">
                            |
                        </span>
                        e Word
                    </span>
                </RootLinkComponent>

                <div className="icon"></div>
            </Link>
            <div className="flex flex-col gap-4">
                {sessionData ? (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="svg-outline relative border-2 border-black px-3 py-1 font-medium text-black dark:border-white dark:text-white"
                                aria-label="Customise options"
                            >
                                {sessionData.user.name}
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content
                            className="z-50 border-2 border-black bg-white text-black dark:border-white dark:bg-black dark:text-white"
                            sideOffset={-2}
                            align="end"
                        >
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="text-medium block cursor-pointer px-3 py-1 no-underline outline-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black"
                                    href={'/history'}
                                >
                                    History
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black"
                                onClick={() => void signOut({ redirect: true })}
                            >
                                Sign out
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                ) : (
                    <button
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black dark:border-white dark:text-white"
                        onClick={() => void signIn()}
                    >
                        Sign in
                    </button>
                )}
            </div>
        </nav>
    )
}
