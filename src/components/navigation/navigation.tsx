"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Popover from "@radix-ui/react-popover"
import { useQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { signOut, useSession } from "next-auth/react"
import Head from "next/head"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import { fetchBuiltinThemes, fetchLastVerse, fetchUserThemes } from "~/lib/api"
import { Translation } from "~/lib/parseEsv"
import { toPassageSegment } from "~/lib/passageSegment"
import { tryParseTranslation } from "~/lib/translations"
import { BuiltinThemeRecord } from "~/server/repositories/builtinTheme.repository"
import { TypedVerse } from "~/server/repositories/typingSession.repository"
import { UserThemeRecord } from "~/server/repositories/userTheme.repository"

import HotkeyLabel from "../hotkey-label"
import { CreateThemeForm } from "./create-theme-form"
import { EarlyAccess } from "./early-access"
import { Settings } from "./settings"

export function Navigation({
    builtinThemes: serverRenderedBuiltinThemes,
    userThemes: serverRenderedUserThemes,
    lastTranslation: serverLastTranslation,
    hasClassroomAccess,
    ...props
}: {
    userThemes: UserThemeRecord[]
    builtinThemes: BuiltinThemeRecord[]
    lastTypedVerse: TypedVerse | null
    lastTranslation: Translation
    hasClassroomAccess: boolean
}) {
    const { data: sessionData } = useSession()
    const isRootPath = usePathname() === "/"
    const searchParams = useSearchParams()
    const RootLinkComponent = isRootPath ? "h1" : "span"
    const dropDownTriggerRef = useRef<HTMLButtonElement>(null)
    const [isSettingsOpen, setSettingsOpen] = useState(false)
    const [settingsState, setSettingsState] = useState<
        "initial" | "create-theme" | "edit-theme"
    >("initial")

    useHotkeys(
        "mod+shift+comma",
        () => setSettingsOpen(prev => !prev),
        { enableOnFormTags: true },
        [setSettingsOpen],
    )

    const builtinThemes = useQuery({
        queryKey: ["builtinThemes"],
        queryFn: fetchBuiltinThemes,
        placeholderData: serverRenderedBuiltinThemes,
    })

    const userThemes = useQuery({
        queryKey: ["userThemes"],
        queryFn: fetchUserThemes,
        enabled: Boolean(sessionData?.user.id),
        placeholderData: serverRenderedUserThemes,
    })

    const { data: lastTypedVerse } = useQuery({
        queryKey: ["last-verse"],
        queryFn: fetchLastVerse,
        enabled: sessionData?.user?.id != null,
        placeholderData: props.lastTypedVerse ?? undefined,
    })

    // Get current translation from URL, fallback to cookie, then server value
    const urlTranslation = tryParseTranslation(searchParams?.get("translation"))

    let cookieTranslation: Translation | null = null
    if (typeof document !== "undefined") {
        const cookies = document.cookie.split("; ")
        const translationCookie = cookies.find(row =>
            row.startsWith("lastTranslation="),
        )
        cookieTranslation = tryParseTranslation(
            translationCookie?.split("=")[1],
        )
    }

    const currentTranslation =
        urlTranslation ?? cookieTranslation ?? serverLastTranslation

    const rootPathname = lastTypedVerse
        ? `/passage/${toPassageSegment(
              lastTypedVerse.book,
              lastTypedVerse.chapter,
          )}?translation=${currentTranslation}`
        : `/`

    return (
        <>
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
                    
                    .animated-icon {
                        background-color: oklch(var(--oklch-primary));
                        -webkit-mask-image: url("/bible.svg");
                        mask-image: url("/bible.svg");
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
                        "link svg-outline relative flex items-center gap-1"
                    }
                    href={rootPathname}
                    aria-label={"Type the Word logo"}
                >
                    <RootLinkComponent className="text-xl font-semibold">
                        <span className="text-primary/50">Type th</span>
                        <span className="text-primary relative">
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
                        className="icon stroke-primary block h-[33px] w-[39px]"
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

                    <div className="animated-icon stroke-primary hidden h-[33px] w-[39px]"></div>
                </Link>
                <div className="flex flex-col gap-4">
                    {sessionData ? (
                        <Popover.Root
                            onOpenChange={next => {
                                if (next == false) {
                                    setSettingsState("initial")
                                }
                                setSettingsOpen(next)
                            }}
                            open={isSettingsOpen}
                        >
                            <DropdownMenu.Root modal={false}>
                                <Popover.PopoverAnchor asChild>
                                    <DropdownMenu.Trigger asChild>
                                        <button
                                            ref={dropDownTriggerRef}
                                            className="svg-outline border-primary text-primary relative border-2 px-3 py-1 font-medium"
                                        >
                                            {sessionData.user.name}
                                        </button>
                                    </DropdownMenu.Trigger>
                                </Popover.PopoverAnchor>

                                <DropdownMenu.Content
                                    className="border-primary bg-secondary text-primary z-50 border-2"
                                    sideOffset={-2}
                                    align="end"
                                >
                                    <DropdownMenu.Item asChild={true}>
                                        <Link
                                            className="text-medium group focus:bg-primary focus:text-secondary flex cursor-pointer items-center px-3 py-1 no-underline outline-hidden"
                                            href={"/history"}
                                        >
                                            History
                                            <HotkeyLabel
                                                className="text-primary/80 group-focus:text-secondary/80 ml-auto pl-5 text-sm"
                                                mac="⌘+↑+Y"
                                                nonMac="^+↑+Y"
                                            />
                                        </Link>
                                    </DropdownMenu.Item>
                                    {hasClassroomAccess && (
                                        <DropdownMenu.Item asChild={true}>
                                            <Link
                                                className="text-medium group focus:bg-primary focus:text-secondary flex cursor-pointer items-center px-3 py-1 no-underline outline-hidden"
                                                href={"/classroom/dashboard"}
                                            >
                                                Classroom
                                            </Link>
                                        </DropdownMenu.Item>
                                    )}
                                    <Popover.PopoverTrigger asChild>
                                        <DropdownMenu.Item className="text-medium group focus:bg-primary focus:text-secondary flex cursor-pointer items-center px-3 py-1 no-underline outline-hidden">
                                            Settings
                                            <HotkeyLabel
                                                className="text-primary/80 group-focus:text-secondary/80 ml-auto pl-5 text-sm"
                                                mac="⌘+↑+,"
                                                nonMac="^+↑+,"
                                            />
                                        </DropdownMenu.Item>
                                    </Popover.PopoverTrigger>
                                    <DropdownMenu.Item
                                        className="focus:bg-primary focus:text-secondary cursor-pointer px-3 py-1 outline-hidden"
                                        onClick={() =>
                                            void signOut({ redirect: true })
                                        }
                                    >
                                        Log out
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                                <Popover.PopoverContent
                                    className={clsx(
                                        settingsState === "create-theme"
                                            ? "min-w-100"
                                            : "min-w-52",
                                        "border-primary bg-secondary text-primary z-50 border-2 px-3 py-3 outline-hidden",
                                    )}
                                    sideOffset={-2}
                                    align="end"
                                    onEscapeKeyDown={e => {
                                        setSettingsState("initial")
                                        e.preventDefault()
                                        dropDownTriggerRef.current?.focus()
                                    }}
                                >
                                    {settingsState === "initial" ? (
                                        <>
                                            <h2 className="mb-2 text-xl">
                                                Settings
                                            </h2>
                                            <Settings
                                                createTheme={() =>
                                                    setSettingsState(
                                                        "create-theme",
                                                    )
                                                }
                                                builtinThemes={
                                                    builtinThemes.data ?? []
                                                }
                                                userThemes={
                                                    userThemes.data ?? []
                                                }
                                            />
                                            <div className="border-primary -mx-3 my-3 border-t-2" />
                                            <h2 className="mb-2 text-xl">
                                                Early Access Features
                                            </h2>
                                            <EarlyAccess />
                                        </>
                                    ) : settingsState === "create-theme" ? (
                                        <>
                                            <h2 className="mb-2 text-xl">
                                                Theme Creator
                                            </h2>
                                            <CreateThemeForm
                                                builtinThemes={
                                                    builtinThemes.data ?? []
                                                }
                                                goBackToSettings={() =>
                                                    setSettingsState("initial")
                                                }
                                            />
                                        </>
                                    ) : null}
                                </Popover.PopoverContent>
                            </DropdownMenu.Root>
                        </Popover.Root>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="svg-outline border-primary text-primary relative border-2 px-3 py-1 font-semibold"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </nav>
        </>
    )
}
