"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { isBefore, parseISO } from "date-fns"
import { useSession } from "next-auth/react"
import Link from "next/link"

import { EmailLink } from "~/components/emailLink"
import { fetchUserChangelog } from "~/lib/api"
import { changelogUpdatedAt } from "~/lib/changelogUpdatedAt"
import { cn } from "~/lib/cn"

export function Footer({ className }: { className?: string }) {
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
            <footer
                data-app-footer
                className={cn(
                    "text-primary mb-2 flex w-full flex-col items-center justify-between py-2 text-sm sm:flex-row",
                    className,
                )}
            >
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
                            className="border-primary bg-secondary flex flex-col border-2"
                            sideOffset={4}
                            align="center"
                            side="top"
                        >
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
                                    href={"/copyright"}
                                >
                                    copyright
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
                                    href={"/privacy-policy"}
                                >
                                    privacy
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
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
                    <div>/</div>
                    <Link
                        className="svg-outline relative no-underline"
                        href={"/classroom"}
                    >
                        classroom
                    </Link>
                    <div>/</div>
                    <Link
                        className="svg-outline relative no-underline"
                        href={"/docs"}
                    >
                        docs
                    </Link>
                </div>
                <div className="hidden grow md:block"> </div>
                {/* <div className="block md:hidden">/</div> */}
                <div className="flex items-center justify-between gap-x-3">
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
                                className="animate-spin-every-once-in-a-while text-primary absolute -top-1.5 -right-1.5 origin-center"
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
                            className="border-primary bg-secondary flex flex-col border-2"
                            sideOffset={4}
                            align="center"
                            side="top"
                        >
                            <DropdownMenu.Item asChild>
                                <Link
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
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
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
                                    href={"https://typetheword.kit.com"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    newsletter
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
                                    href={
                                        "https://discord.com/invite/a9eYv4sgWp "
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    discord
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 no-underline outline-hidden"
                                    href={"/donate"}
                                >
                                    donate
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className="focus:bg-primary focus:text-secondary cursor-pointer px-2 py-1 outline-hidden">
                                <EmailLink className="w-full text-left font-normal">
                                    email me
                                </EmailLink>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </div>
            </footer>
        </>
    )
}
