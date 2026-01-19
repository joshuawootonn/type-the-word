"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { isBefore, parseISO } from "date-fns"
import { useSession } from "next-auth/react"
import Link from "next/link"

import { changelogUpdatedAt } from "~/app/(marketing)/changelog/updated-at"
import { EmailLink } from "~/components/emailLink"
import { fetchUserChangelog } from "~/lib/api"

export function Footer() {
    const { data: sessionData } = useSession()
    const { data } = useQuery({
        queryKey: ["user-changelog"],
        queryFn: fetchUserChangelog,
        enabled: sessionData?.user?.id != null,
    })

    const hasSeenChangelog = data != null
    const hasSeenEveryChangelog =
        hasSeenChangelog &&
        isBefore(changelogUpdatedAt, parseISO(data.lastVisitedAt))
    const hasUnreadChangelog =
        !hasSeenChangelog || (hasSeenChangelog && !hasSeenEveryChangelog)

    return (
        <>
            <footer className="flex w-full flex-col items-center justify-between py-2 text-sm text-primary sm:flex-row">
                <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="svg-outline relative no-underline"
                                aria-label="Customise options"
                            >
                                legal
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content
                            className="flex flex-col border-2 border-primary bg-secondary"
                            sideOffset={4}
                            align="center"
                            side="top"
                        >
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={"/copyright"}
                                >
                                    copyright
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={"/privacy-policy"}
                                >
                                    privacy
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={"/terms-of-service"}
                                >
                                    terms
                                </Link>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>

                    <div>/</div>
                    <Link
                        className="svg-outline relative no-underline"
                        href={"/why"}
                    >
                        why?
                    </Link>
                </div>
                <div className="hidden flex-grow md:block"> </div>
                {/* <div className="block md:hidden">/</div> */}
                <div className="flex items-center justify-between space-x-3">
                    <Link
                        className={clsx(`svg-outline relative`)}
                        href={"/donate"}
                    >
                        donate
                    </Link>
                    <div>/</div>
                    <Link
                        className={clsx(`svg-outline relative`)}
                        href={"/changelog"}
                    >
                        changelog
                        {hasUnreadChangelog && (
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 8 8"
                                fill="currentColor"
                                className="absolute -right-1.5 -top-1.5 origin-center animate-spin-every-once-in-a-while text-primary"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6.45795 2.71729L1.03912 5.25967"
                                    className="stroke-primary"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M2.48865 1.3031L5.00845 6.67379"
                                    className="stroke-primary"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        )}
                    </Link>
                    <div>/</div>
                    <EmailLink className={"svg-outline shrink-0 font-normal"}>
                        email me
                    </EmailLink>
                    <div>/</div>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="svg-outline relative no-underline"
                                aria-label="Customise options"
                            >
                                connect
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content
                            className="flex flex-col border-2 border-primary bg-secondary"
                            sideOffset={4}
                            align="center"
                            side="top"
                        >
                            <DropdownMenu.Item asChild>
                                <Link
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={
                                        "https://github.com/joshuawootonn/type-the-word"
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    github
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={"https://typetheword.kit.com"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    newsletter
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-primary focus:text-secondary"
                                    href={
                                        "https://discord.com/invite/a9eYv4sgWp "
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    discord
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                asChild={true}
                            ></DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </div>
            </footer>
        </>
    )
}
