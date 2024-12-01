'use client'

import { useTheme } from 'next-themes'
import { signIn, signOut, useSession } from 'next-auth/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import Link from 'next/link'
import Head from 'next/head'
import { usePathname } from 'next/navigation'
import {
    fetchCreateTheme,
    fetchCurrentTheme,
    fetchDeleteTheme,
    fetchLastVerse,
    fetchSetCurrentTheme,
    fetchThemes,
} from '~/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toPassageSegment } from '~/lib/passageSegment'
import { TypedVerse } from '~/server/repositories/typingSession.repository'
import { useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import HotkeyLabel from './hotkey-label'
import clsx from 'clsx'
import Color from 'colorjs.io'
import { ThemeRecord } from '~/server/repositories/theme.repository'
import { BuiltinTheme } from '~/app/layout'

const SELECTION_KEYS = [' ', 'Enter']

type Theme = {
    label: string
    value: string
    primary: string
    secondary: string
    success: string
    error: string
}

type SettingsState =
    | { state: 'initial' }
    | {
          state: 'create-theme'
          theme: Theme
      }
    | { state: 'edit-theme' }

function stringToLCH(myString: string): {
    lightness: number
    chroma: number
    hue: number
} {
    const a = myString.split(' ')

    return {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        lightness: parseFloat(a.at(0)?.replace('%', '')!),
        chroma: parseFloat(a.at(1)!),
        hue: parseFloat(a.at(2)!),
    }
}

export function Navigation(props: {
    themes: ThemeRecord[]
    lastTypedVerse: TypedVerse | null
}) {
    const { data: sessionData } = useSession()
    const isRootPath = usePathname() === '/'
    const RootLinkComponent = isRootPath ? 'h1' : 'span'
    const dropDownTriggerRef = useRef<HTMLButtonElement>(null)
    const { theme, setTheme } = useTheme()
    const [isSettingsOpen, setSettingsOpen] = useState(false)
    const [settingsState, _setSettingsState] = useState<SettingsState>({
        state: 'initial',
    })

    const currentTheme = useQuery({
        queryKey: ['currentTheme'],
        queryFn: fetchCurrentTheme,
        enabled: sessionData?.user?.id != null,
        initialData: null,
    })

    const queryClient = useQueryClient()

    const setCurrentTheme = useMutation({
        mutationFn: fetchSetCurrentTheme,
        // When mutate is called:
        onMutate: async nextCurrentTheme => {
            // Cancel any outgoing refetches
            // (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['currentTheme'] })

            // Snapshot the previous value
            const prevCurrentTheme = queryClient.getQueryData(['currentTheme'])

            // Optimistically update to the new value
            queryClient.setQueryData(['currentTheme'], nextCurrentTheme)

            // Return a context with the previous and new todo
            return { prevCurrentTheme, nextCurrentTheme }
        },
        // If the mutation fails, use the context we returned above
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(
                ['currentTheme'],
                context?.prevCurrentTheme,
            )
        },
        // Always refetch after error or success:
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['currentTheme'] }),
    })

    const _createTheme = useMutation({
        mutationFn: fetchCreateTheme,
        // When mutate is called:
        onMutate: async nextTheme => {
            // Cancel any outgoing refetches
            // (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['themes'] })

            // Snapshot the previous value
            const prevThemes = queryClient.getQueryData(['themes'])

            // Optimistically update to the new value
            queryClient.setQueryData(
                ['themes'],
                (prev: ThemeRecord[] | undefined) =>
                    prev
                        ? [...prev, { id: '', ...nextTheme }]
                        : [{ id: '', ...nextTheme }],
            )

            // Return a context with the previous and new todo
            return { prevThemes }
        },
        // If the mutation fails, use the context we returned above
        onError: (err, theme, context) => {
            queryClient.setQueryData(['themes'], context?.prevThemes ?? [])
        },
        // Always refetch after error or success:
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['themes'] }),
    })

    const deleteTheme = useMutation({
        mutationFn: fetchDeleteTheme,
        // When mutate is called:
        onMutate: async id => {
            // Cancel any outgoing refetches
            // (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['themes'] })

            // Snapshot the previous value
            const prevThemes = queryClient.getQueryData(['themes'])

            // Optimistically update to the new value
            queryClient.setQueryData(
                ['themes'],
                (prev: ThemeRecord[] | undefined) =>
                    prev?.filter(theme => theme.id !== id),
            )

            // Return a context with the previous and new todo
            return { prevThemes }
        },
        // If the mutation fails, use the context we returned above
        onError: (err, theme, context) => {
            queryClient.setQueryData(['themes'], context?.prevThemes ?? [])
        },
        // Always refetch after error or success:
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['themes'] }),
    })

    const themes = useQuery({
        queryKey: ['themes'],
        queryFn: fetchThemes,
        enabled: sessionData?.user?.id != null,
        initialData: props.themes,
    })

    const builtinThemes: BuiltinTheme[] = [
        {
            label: 'Light',
            value: 'light',
            primaryLightness: 0,
            primaryHue: 0,
            primaryChroma: 0,
            secondaryLightness: 100,
            secondaryHue: 0,
            secondaryChroma: 0,
            successLightness: 56.53,
            successHue: 0.1293,
            successChroma: 157.54,
            errorLightness: 46.77,
            errorHue: 0.1878,
            errorChroma: 5.32,
        },
        {
            label: 'Dark',
            value: 'dark',
            primaryLightness: 100,
            primaryHue: 0,
            primaryChroma: 0,
            secondaryLightness: 0,
            secondaryHue: 0,
            secondaryChroma: 0,
            successLightness: 56.53,
            successHue: 0.1293,
            successChroma: 157.54,
            errorLightness: 46.77,
            errorHue: 0.1878,
            errorChroma: 5.32,
        },
    ]

    function setSettingsState(value: SettingsState) {
        if (value.state === 'create-theme') {
            setTheme('create-theme')
            _setSettingsState({
                ...value,
                theme: {
                    ...value.theme,
                    value: value.theme.label.split(' ').join('-').toLowerCase(),
                },
            })

            document.documentElement.style.setProperty(
                '--color-primary',
                value.theme.primary,
            )
            document.documentElement.style.setProperty(
                '--color-secondary',
                value.theme.secondary,
            )
            document.documentElement.style.setProperty(
                '--color-success',
                value.theme.success,
            )
            document.documentElement.style.setProperty(
                '--color-incorrect',
                value.theme.error,
            )
        } else {
            _setSettingsState(value)
        }
    }

    function createTheme() {
        setSettingsState({
            state: 'create-theme',
            theme: {
                label: '',
                value: '',
                primary: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-primary'),
                secondary: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-secondary'),
                success: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-success'),
                error: window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue('--color-incorrect'),
            },
        })
    }

    function selectTheme(next: string) {
        const nextTheme: ThemeRecord | BuiltinTheme | null =
            [...builtinThemes, ...(themes.data ?? [])].find(
                theme => theme.value === next,
            ) ?? null
        setTheme(next)
        if (nextTheme == null) return
        console.log(nextTheme, next)

        if ('id' in nextTheme) {
            void setCurrentTheme.mutateAsync({
                currentThemeValue: nextTheme.value,
                currentDarkThemeId: nextTheme.id as string,
                currentLightThemeId: nextTheme.id as string,
            })
        } else {
            void setCurrentTheme.mutateAsync({
                currentThemeValue: nextTheme.value,
                currentDarkThemeId: null,
                currentLightThemeId: null,
            })
        }

        document.documentElement.style.setProperty(
            '--color-primary',
            `${nextTheme.primaryLightness}% ${nextTheme.primaryChroma} ${nextTheme.primaryHue}`,
        )
        document.documentElement.style.setProperty(
            '--color-secondary',
            `${nextTheme.secondaryLightness}% ${nextTheme.secondaryChroma} ${nextTheme.secondaryHue}`,
        )
        document.documentElement.style.setProperty(
            '--color-success',
            `${nextTheme.successLightness}% ${nextTheme.successChroma} ${nextTheme.successHue}`,
        )
        document.documentElement.style.setProperty(
            '--color-incorrect',
            `${nextTheme.errorLightness}% ${nextTheme.errorChroma} ${nextTheme.errorHue}`,
        )
    }

    console.log(
        'current Value',
        currentTheme?.data?.label ?? theme === 'system'
            ? 'System'
            : theme
            ? themes.data.find(t => t.value === theme)?.label
            : 'System',
        currentTheme?.data?.label,
        theme === 'system',
        theme,
        themes.data.find(t => t.value === theme)?.label,
        themes.data,
    )

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
                    background-color: oklch(var(--color-primary));
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
                        onOpenChange={next => {
                            if (next == false) {
                                setSettingsState({ state: 'initial' })
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
                                className={clsx(
                                    settingsState.state === 'create-theme'
                                        ? 'min-w-100'
                                        : 'min-w-52',
                                    'z-50  border-2 border-primary bg-secondary px-3 py-3 text-primary',
                                )}
                                sideOffset={-2}
                                align="end"
                                onCloseAutoFocus={e => {
                                    setSettingsState({ state: 'initial' })
                                    e.preventDefault()
                                    dropDownTriggerRef.current?.focus()
                                }}
                            >
                                {settingsState.state === 'initial' ? (
                                    <>
                                        <h2 className="mb-2 text-xl">
                                            Settings
                                        </h2>
                                        <div className="flex flex-row items-center justify-between">
                                            <label
                                                htmlFor="theme-selector"
                                                className="pr-4"
                                            >
                                                Theme:
                                            </label>

                                            <DropdownMenu.Root>
                                                <DropdownMenu.Trigger
                                                    id="theme-selector"
                                                    className="svg-outline relative h-full cursor-pointer border-2 border-primary px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                >
                                                    {currentTheme?.data
                                                        ?.label ??
                                                    theme === 'system'
                                                        ? 'System'
                                                        : theme
                                                        ? builtinThemes.find(
                                                              t =>
                                                                  t.value ===
                                                                  theme,
                                                          )?.label
                                                        : 'System'}
                                                </DropdownMenu.Trigger>

                                                <DropdownMenu.Portal>
                                                    <DropdownMenu.Content
                                                        side="bottom"
                                                        avoidCollisions={false}
                                                        className="z-50 w-40 border-2 border-primary bg-secondary text-primary "
                                                        align="end"
                                                        sideOffset={-2}
                                                    >
                                                        <DropdownMenu.Item
                                                            onSelect={() =>
                                                                selectTheme(
                                                                    'system',
                                                                )
                                                            }
                                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                        >
                                                            System
                                                        </DropdownMenu.Item>
                                                        {builtinThemes.map(
                                                            theme => (
                                                                <DropdownMenu.Item
                                                                    key={
                                                                        theme.value
                                                                    }
                                                                    onSelect={() =>
                                                                        selectTheme(
                                                                            theme.value,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                                >
                                                                    {
                                                                        theme.label
                                                                    }
                                                                </DropdownMenu.Item>
                                                            ),
                                                        )}
                                                        {themes.data.map(t => (
                                                            <DropdownMenu.Sub
                                                                key={t.value}
                                                            >
                                                                <DropdownMenu.SubTrigger className="flex cursor-pointer flex-row items-center px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary ">
                                                                    <span className="flex-grow truncate">
                                                                        {
                                                                            t.label
                                                                        }
                                                                    </span>
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                        stroke="currentColor"
                                                                        className="size-4 shrink-0"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                                                        />
                                                                    </svg>
                                                                </DropdownMenu.SubTrigger>
                                                                <DropdownMenu.Portal>
                                                                    <DropdownMenu.SubContent className="border-2 border-primary bg-secondary text-primary">
                                                                        <DropdownMenu.Item
                                                                            onSelect={() =>
                                                                                selectTheme(
                                                                                    t.value,
                                                                                )
                                                                            }
                                                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                                                        >
                                                                            Select
                                                                        </DropdownMenu.Item>
                                                                        <DropdownMenu.Item
                                                                            onSelect={() => {
                                                                                if (
                                                                                    theme ===
                                                                                    t.value
                                                                                ) {
                                                                                    const prefersDark =
                                                                                        window.matchMedia(
                                                                                            '(prefers-color-scheme: dark)',
                                                                                        ).matches
                                                                                    selectTheme(
                                                                                        prefersDark
                                                                                            ? 'dark'
                                                                                            : 'light',
                                                                                    )

                                                                                    document.documentElement.style.removeProperty(
                                                                                        '--color-primary',
                                                                                    )
                                                                                    document.documentElement.style.removeProperty(
                                                                                        '--color-secondary',
                                                                                    )
                                                                                    document.documentElement.style.removeProperty(
                                                                                        '--color-success',
                                                                                    )
                                                                                    document.documentElement.style.removeProperty(
                                                                                        '--color-incorrect',
                                                                                    )
                                                                                }

                                                                                void deleteTheme.mutateAsync(
                                                                                    t.id,
                                                                                )
                                                                            }}
                                                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                                                        >
                                                                            Delete
                                                                        </DropdownMenu.Item>
                                                                    </DropdownMenu.SubContent>
                                                                </DropdownMenu.Portal>
                                                            </DropdownMenu.Sub>
                                                        ))}
                                                        <DropdownMenu.Item
                                                            className="flex cursor-pointer flex-row items-center justify-between space-x-2 px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                                                            onKeyDown={e => {
                                                                if (
                                                                    SELECTION_KEYS.includes(
                                                                        e.key,
                                                                    )
                                                                ) {
                                                                    e.preventDefault()
                                                                    createTheme()
                                                                }
                                                            }}
                                                            onPointerUp={e => {
                                                                e.preventDefault()
                                                                createTheme()
                                                            }}
                                                        >
                                                            New theme
                                                            <div>
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={
                                                                        3
                                                                    }
                                                                    stroke="currentColor"
                                                                    className="size-4"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 4.5v15m7.5-7.5h-15"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </DropdownMenu.Item>
                                                    </DropdownMenu.Content>
                                                </DropdownMenu.Portal>
                                            </DropdownMenu.Root>
                                        </div>
                                    </>
                                ) : settingsState.state === 'create-theme' ? (
                                    <>
                                        <h2 className="mb-2 text-xl">
                                            Theme Creator
                                        </h2>
                                        <form
                                            onSubmit={() => {
                                                const primary = stringToLCH(
                                                    window
                                                        .getComputedStyle(
                                                            document.documentElement,
                                                        )
                                                        .getPropertyValue(
                                                            '--color-primary',
                                                        ),
                                                )
                                                const secondary = stringToLCH(
                                                    window
                                                        .getComputedStyle(
                                                            document.documentElement,
                                                        )
                                                        .getPropertyValue(
                                                            '--color-secondary',
                                                        ),
                                                )
                                                const success = stringToLCH(
                                                    window
                                                        .getComputedStyle(
                                                            document.documentElement,
                                                        )
                                                        .getPropertyValue(
                                                            '--color-success',
                                                        ),
                                                )
                                                const error = stringToLCH(
                                                    window
                                                        .getComputedStyle(
                                                            document.documentElement,
                                                        )
                                                        .getPropertyValue(
                                                            '--color-incorrect',
                                                        ),
                                                )

                                                void _createTheme.mutateAsync({
                                                    label: settingsState.theme
                                                        .label,
                                                    value: settingsState.theme
                                                        .value,
                                                    primaryLightness:
                                                        primary.lightness,
                                                    primaryChroma:
                                                        primary.chroma,
                                                    primaryHue: primary.hue,
                                                    secondaryLightness:
                                                        secondary.lightness,
                                                    secondaryChroma:
                                                        secondary.chroma,
                                                    secondaryHue: secondary.hue,
                                                    successLightness:
                                                        success.lightness,
                                                    successChroma:
                                                        success.chroma,
                                                    successHue: success.hue,
                                                    errorLightness:
                                                        error.lightness,
                                                    errorChroma: error.chroma,
                                                    errorHue: error.hue,
                                                })
                                                setTheme(
                                                    settingsState.theme.value,
                                                )
                                                setSettingsState({
                                                    state: 'initial',
                                                })
                                            }}
                                            className="col-2 grid grid-cols-2 items-center gap-x-2 gap-y-4 [&>*:nth-child(even)]:justify-self-end"
                                        >
                                            <label
                                                htmlFor="theme-name"
                                                className="pr-4"
                                            >
                                                Theme name:
                                            </label>
                                            <div className="svg-outline relative">
                                                <input
                                                    value={
                                                        settingsState.theme
                                                            .label
                                                    }
                                                    onChange={event =>
                                                        setSettingsState(
                                                            settingsState.state ===
                                                                'create-theme'
                                                                ? {
                                                                      ...settingsState,
                                                                      theme: {
                                                                          ...settingsState.theme,
                                                                          label:
                                                                              event
                                                                                  .currentTarget
                                                                                  ?.value ??
                                                                              '',
                                                                      },
                                                                  }
                                                                : settingsState,
                                                        )
                                                    }
                                                    placeholder="Untitled theme"
                                                    autoFocus={true}
                                                    onFocus={e =>
                                                        e.currentTarget.select()
                                                    }
                                                    className={
                                                        'w-40 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none placeholder:text-primary/50'
                                                    }
                                                    id="theme-name"
                                                    autoComplete="off"
                                                    data-1p-ignore={true}
                                                />
                                            </div>
                                            <ColorInput
                                                label="Primary Hue"
                                                value={
                                                    settingsState.theme.primary
                                                }
                                                onChange={value =>
                                                    setSettingsState({
                                                        ...settingsState,
                                                        theme: {
                                                            ...settingsState.theme,
                                                            primary: value,
                                                        },
                                                    })
                                                }
                                            />
                                            <ColorInput
                                                label="Secondary Hue"
                                                value={
                                                    settingsState.theme
                                                        .secondary
                                                }
                                                onChange={value =>
                                                    setSettingsState({
                                                        ...settingsState,
                                                        theme: {
                                                            ...settingsState.theme,
                                                            secondary: value,
                                                        },
                                                    })
                                                }
                                            />
                                            <ColorInput
                                                label="Success Hue"
                                                value={
                                                    settingsState.theme.success
                                                }
                                                onChange={value =>
                                                    setSettingsState({
                                                        ...settingsState,
                                                        theme: {
                                                            ...settingsState.theme,
                                                            success: value,
                                                        },
                                                    })
                                                }
                                            />
                                            <ColorInput
                                                label="Error Hue"
                                                value={
                                                    settingsState.theme.error
                                                }
                                                onChange={value =>
                                                    setSettingsState({
                                                        ...settingsState,
                                                        theme: {
                                                            ...settingsState.theme,
                                                            error: value,
                                                        },
                                                    })
                                                }
                                            />
                                            <button
                                                type="submit"
                                                className="svg-outline relative col-span-2 border-2 border-primary px-3 py-1 font-semibold text-primary"
                                            >
                                                Save{' '}
                                            </button>
                                            <input
                                                className="hidden"
                                                type="submit"
                                            />
                                        </form>
                                    </>
                                ) : null}
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

function ColorInput(props: {
    value: string
    label: string
    onChange: (number: string) => void
}) {
    const rgbValue = new Color(`oklch(${props.value})`).to('srgb').toString({
        format: 'hex',
        collapse: false,
    })
    return (
        <>
            <label htmlFor="primary-hue" className="pr-4">
                {props.label}
            </label>

            <div className="group relative z-0 h-8 w-8">
                <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
                <input
                    type="color"
                    className="border-2 border-primary outline-none"
                    value={rgbValue}
                    onChange={e => {
                        const color = new Color(e.currentTarget.value).to(
                            'oklch',
                        )

                        props.onChange(
                            color
                                .toString({ precision: 4 })
                                .replace(')', '')
                                .replace('oklch(', ''),
                        )
                    }}
                />
            </div>
            <style jsx>{`
                input[type='color'] {
                    -webkit-appearance: none;
                    width: 32px;
                    height: 32px;
                }
                input[type='color']::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                input[type='color']::-webkit-color-swatch {
                    border: none;
                }
            `}</style>
        </>
    )
}
