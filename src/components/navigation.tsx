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
                    background-image: url('/bible.svg');
                    background-repeat: no-repeat;
                    background-position: -741px 0;
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

                @media (prefers-color-scheme: dark) {
                    .icon,
                    .animated-icon {
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

                <svg
                    width="39"
                    height="33"
                    viewBox="0 0 39 33"
                    fill="none"
                    className="icon translate-y-[1px] dark:invert"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M19.7754 5.04895V31.7156M23.6464 6.59934H33.3238M23.6464 10.6303L31.6577 10.6303M23.6464 14.6614H33.3238M23.6464 18.6924L29.8873 18.6924M23.6464 22.4133H33.3238M6.22705 6.59934L13.7748 6.59934M6.22705 10.6303H15.9045M6.22705 14.6614L14.8396 14.6614M6.22705 18.6924H15.9045M6.22705 22.4133L12.5399 22.4133"
                        stroke="black"
                        stroke-width="2"
                    />
                    <path
                        d="M2.11353 27.5747V1.94971H15.9209C18.2328 1.94971 19.7741 2.88721 19.7741 5.07471C19.7741 2.88721 21.0585 1.94971 23.6273 1.94971H37.1135V27.5747H23.6273C20.7374 27.5747 19.7741 30.3872 19.7741 31.9497C19.7741 30.3872 18.4897 27.5747 15.2787 27.5747H2.11353Z"
                        stroke="black"
                        stroke-width="2"
                    />
                </svg>

                <div className="animated-icon"></div>
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
