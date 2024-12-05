import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { BuiltinTheme } from '~/app/layout'
import { fetchDeleteTheme } from '~/lib/api'
import { ThemeRecord } from '~/server/repositories/theme.repository'
import { useSyncedTheme } from './use-synced-theme'
import { useRef, useEffect } from 'react'

const SELECTION_KEYS = [' ', 'Enter']

export function Settings({
    builtinThemes,
    themes,
    createTheme,
}: {
    themes: ThemeRecord[]
    builtinThemes: BuiltinTheme[]
    createTheme: () => void
}) {
    const queryClient = useQueryClient()
    const { theme, setTheme } = useSyncedTheme()

    const deleteTheme = useMutation({
        mutationFn: fetchDeleteTheme,
        onMutate: async id => {
            await queryClient.cancelQueries({ queryKey: ['themes'] })

            const prevThemes = queryClient.getQueryData(['themes'])

            queryClient.setQueryData(
                ['themes'],
                (prev: ThemeRecord[] | undefined) =>
                    prev?.filter(theme => theme.id !== id),
            )

            return { prevThemes }
        },
        onError: (_err, _theme, context) => {
            queryClient.setQueryData(['themes'], context?.prevThemes ?? [])
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['themes'] }),
    })

    const ref = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        ref.current?.focus()
    }, [])

    return (
        <div className="flex flex-row items-center justify-between">
            <label htmlFor="theme-selector" className="pr-4">
                Theme:
            </label>

            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    id="theme-selector"
                    className="svg-outline relative h-full cursor-pointer border-2 border-primary px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                    ref={ref}
                >
                    {theme === 'system'
                        ? 'System'
                        : themes.find(t => t.value === theme)?.label ??
                          builtinThemes.find(t => t.value === theme)?.label}
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        side="bottom"
                        className=" z-50 w-40 border-2 border-primary bg-secondary text-primary "
                        align="end"
                        sideOffset={-2}
                        loop
                    >
                        <DropdownMenu.Item
                            onSelect={() => setTheme('system')}
                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                        >
                            System
                        </DropdownMenu.Item>
                        {builtinThemes.map(theme => (
                            <DropdownMenu.Item
                                key={theme.value}
                                onSelect={() => setTheme(theme.value)}
                                className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary "
                            >
                                {theme.label}
                            </DropdownMenu.Item>
                        ))}
                        {themes.map(t => (
                            <DropdownMenu.Sub key={t.value}>
                                <DropdownMenu.SubTrigger className="flex cursor-pointer flex-row items-center px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary ">
                                    <span className="flex-grow truncate">
                                        {t.label}
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
                                        className="border-2 border-primary bg-secondary text-primary"
                                    >
                                        <DropdownMenu.Item
                                            onSelect={() => setTheme(t.value)}
                                            className="cursor-pointer px-3 py-1 font-medium outline-none focus:bg-primary focus:text-secondary"
                                        >
                                            Select
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            onSelect={() => {
                                                if (theme === t.value) {
                                                    const prefersDark =
                                                        window.matchMedia(
                                                            '(prefers-color-scheme: dark)',
                                                        ).matches
                                                    setTheme(
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
                                                        '--color-error',
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
    )
}
