import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useEffect, useCallback } from "react"

import {
    getDarkTheme,
    getLightTheme,
    getResolvedTheme,
    useTheme,
} from "~/app/theme-provider"
import { fetchDeleteTheme } from "~/lib/api"
import { useAnalytics } from "~/lib/hooks/useAnalytics"
import { isThemeDark } from "~/lib/theme/lch"
import {
    BuiltinThemeRecord,
    ThemeRecord,
} from "~/server/repositories/builtinTheme.repository"
import { UserThemeRecord } from "~/server/repositories/userTheme.repository"

const SELECTION_KEYS = [" ", "Enter"]

export function Settings({
    builtinThemes,
    userThemes,
    createTheme,
}: {
    userThemes: UserThemeRecord[]
    builtinThemes: BuiltinThemeRecord[]
    createTheme: () => void
}) {
    const { currentTheme, setTheme } = useTheme()
    const ref = useRef<HTMLButtonElement>(null)
    const { trackThemeDeleted } = useAnalytics()

    useEffect(() => {
        ref.current?.focus()
    }, [])

    const lightThemeId = builtinThemes.find(
        t => t.theme.label === "Light",
    )!.themeId
    const darkThemeId = builtinThemes.find(
        t => t.theme.label === "Dark",
    )!.themeId
    const queryClient = useQueryClient()
    const deleteThemeQuery = useMutation({
        mutationFn: fetchDeleteTheme,
        onMutate: async id => {
            await queryClient.cancelQueries({ queryKey: ["userThemes"] })

            const prevThemes = queryClient.getQueryData(["userThemes"])

            queryClient.setQueryData(
                ["userThemes"],
                (prev: ThemeRecord[] | undefined) =>
                    prev?.filter(theme => theme.id !== id),
            )

            return { prevThemes }
        },
        onError: (_err, _theme, context) => {
            queryClient.setQueryData(["userThemes"], context?.prevThemes ?? [])
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ["userThemes"] }),
    })

    const selectLightSystemTheme = useCallback(
        (theme: BuiltinThemeRecord | UserThemeRecord) => {
            return setTheme({
                colorScheme: "system",
                darkThemeId: currentTheme.darkThemeId,
                lightThemeId: theme.themeId,
            })
        },
        [currentTheme.darkThemeId, setTheme],
    )

    const selectDarkSystemTheme = useCallback(
        (theme: BuiltinThemeRecord | UserThemeRecord) => {
            return setTheme({
                colorScheme: "system",
                darkThemeId: theme.themeId,
                lightThemeId: currentTheme.lightThemeId,
            })
        },
        [currentTheme.lightThemeId, setTheme],
    )

    const selectTheme = useCallback(
        (theme: BuiltinThemeRecord | UserThemeRecord) => {
            if (isThemeDark(theme.theme)) {
                return setTheme({
                    colorScheme: "dark",
                    darkThemeId: theme.themeId,
                    lightThemeId: null,
                })
            } else {
                return setTheme({
                    colorScheme: "light",
                    darkThemeId: null,
                    lightThemeId: theme.themeId,
                })
            }
        },
        [setTheme],
    )

    const deleteTheme = useCallback(
        (theme: UserThemeRecord) => {
            let nextLightThemeId: string | null = null
            let nextDarkThemeId: string | null = null

            nextLightThemeId =
                theme.themeId === currentTheme.lightThemeId
                    ? lightThemeId
                    : currentTheme.lightThemeId

            nextDarkThemeId =
                theme.themeId === currentTheme.darkThemeId
                    ? darkThemeId
                    : currentTheme.darkThemeId

            setTheme({
                colorScheme: currentTheme.colorScheme,
                darkThemeId: nextDarkThemeId,
                lightThemeId: nextLightThemeId,
            })

            trackThemeDeleted({
                theme_name: theme.theme.label,
            })
            deleteThemeQuery.mutate(theme.themeId)
        },
        [
            currentTheme.colorScheme,
            currentTheme.darkThemeId,
            currentTheme.lightThemeId,
            darkThemeId,
            deleteThemeQuery,
            lightThemeId,
            trackThemeDeleted,
            setTheme,
        ],
    )

    return (
        <div className="flex w-[380px] flex-col gap-2.5">
            <div className="flex flex-row items-center justify-between">
                <label htmlFor="theme-selector" className="pr-4">
                    Theme:
                </label>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                        id="theme-selector"
                        className="svg-outline relative h-full cursor-pointer border-2 border-primary px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                        ref={ref}
                    >
                        {currentTheme.colorScheme === "system"
                            ? "System"
                            : getResolvedTheme(
                                  currentTheme,
                                  userThemes,
                                  builtinThemes,
                              ).resolvedTheme.theme.label}{" "}
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            side="bottom"
                            className="z-50 w-40 border-2 border-primary bg-secondary text-primary"
                            align="end"
                            sideOffset={-2}
                            loop
                        >
                            <DropdownMenu.Item
                                onSelect={() =>
                                    setTheme({
                                        colorScheme: "system",
                                        lightThemeId:
                                            currentTheme.lightThemeId ??
                                            lightThemeId,
                                        darkThemeId:
                                            currentTheme.darkThemeId ??
                                            darkThemeId,
                                    })
                                }
                                className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                            >
                                System
                            </DropdownMenu.Item>
                            {builtinThemes.map(t => (
                                <DropdownMenu.Item
                                    key={t.themeId}
                                    onSelect={() => selectTheme(t)}
                                    className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                >
                                    {t.theme.label}
                                </DropdownMenu.Item>
                            ))}
                            {userThemes.map(t => (
                                <DropdownMenu.Sub key={t.themeId}>
                                    <DropdownMenu.SubTrigger className="flex cursor-pointer flex-row items-center px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary">
                                        <span className="flex-grow truncate">
                                            {t.theme.label}
                                        </span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={3}
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
                                        <DropdownMenu.SubContent
                                            loop
                                            className="z-50 border-2 border-primary bg-secondary text-primary"
                                        >
                                            <DropdownMenu.Item
                                                onSelect={() => selectTheme(t)}
                                                className="h-[31px] cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                            >
                                                Select
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                onSelect={() => deleteTheme(t)}
                                                className="h-[31px] cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                            >
                                                Delete
                                            </DropdownMenu.Item>
                                        </DropdownMenu.SubContent>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Sub>
                            ))}
                            <DropdownMenu.Item
                                className="flex cursor-pointer flex-row items-center justify-between space-x-2 px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                onKeyDown={e => {
                                    if (SELECTION_KEYS.includes(e.key)) {
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
                                        strokeWidth={3}
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
            {currentTheme.colorScheme === "system" ? (
                <>
                    <div className="flex flex-row items-center justify-between">
                        <label htmlFor="theme-selector" className="pr-4">
                            Light:
                        </label>

                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger
                                id="theme-selector"
                                className="svg-outline relative h-full cursor-pointer border-2 border-primary px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                            >
                                {
                                    getLightTheme(
                                        currentTheme,
                                        userThemes,
                                        builtinThemes,
                                    ).theme.label
                                }{" "}
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    side="bottom"
                                    className="z-50 w-40 border-2 border-primary bg-secondary text-primary"
                                    align="end"
                                    sideOffset={-2}
                                    loop
                                >
                                    {builtinThemes.map(t => (
                                        <DropdownMenu.Item
                                            key={t.themeId}
                                            onSelect={() =>
                                                selectLightSystemTheme(t)
                                            }
                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                        >
                                            {t.theme.label}
                                        </DropdownMenu.Item>
                                    ))}
                                    {userThemes.map(t => (
                                        <DropdownMenu.Item
                                            key={t.themeId}
                                            onSelect={() =>
                                                selectLightSystemTheme(t)
                                            }
                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                        >
                                            {t.theme.label}
                                        </DropdownMenu.Item>
                                    ))}
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </div>
                    <div className="flex flex-row items-center justify-between">
                        <label htmlFor="theme-selector" className="pr-4">
                            Dark:
                        </label>

                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger
                                id="theme-selector"
                                className="svg-outline relative h-full cursor-pointer border-2 border-primary px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                            >
                                {
                                    getDarkTheme(
                                        currentTheme,
                                        userThemes,
                                        builtinThemes,
                                    ).theme.label
                                }{" "}
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    side="bottom"
                                    className="z-50 w-40 border-2 border-primary bg-secondary text-primary"
                                    align="end"
                                    sideOffset={-2}
                                    loop
                                >
                                    {builtinThemes.map(t => (
                                        <DropdownMenu.Item
                                            key={t.themeId}
                                            onSelect={() =>
                                                selectDarkSystemTheme(t)
                                            }
                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                        >
                                            {t.theme.label}
                                        </DropdownMenu.Item>
                                    ))}
                                    {userThemes.map(t => (
                                        <DropdownMenu.Item
                                            key={t.themeId}
                                            onSelect={() =>
                                                selectDarkSystemTheme(t)
                                            }
                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                        >
                                            {t.theme.label}
                                        </DropdownMenu.Item>
                                    ))}
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </div>
                </>
            ) : null}
        </div>
    )
}
