import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Session } from 'next-auth'
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
} from 'react'
import {
    fetchBuiltinThemes,
    fetchCurrentTheme,
    fetchSetCurrentTheme,
    fetchUserThemes,
} from '~/lib/api'
import {
    BuiltinThemeRecord,
    ThemeRecord,
} from '~/server/repositories/builtinTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'

const ThemeContext = createContext<{
    themes: ThemeRecord[]
    currentTheme: CurrentTheme
    setTheme: (currentTheme: Omit<CurrentTheme, 'userId'>) => void
}>({
    themes: [],
    currentTheme: {
        lightThemeId: '',
        darkThemeId: '',
        userId: '',
        colorScheme: 'system',
    },
    setTheme: () => {
        console.warn('`setTheme` called outside of `ThemeProvider` context')
    },
})

export const useTheme = function () {
    return useContext(ThemeContext)
}

function getResolvedTheme(
    currentTheme: Omit<CurrentTheme, 'userId'>,
    userThemes: UserThemeRecord[],
    builtinThemes: BuiltinThemeRecord[],
): { isDark: boolean; resolvedTheme: BuiltinThemeRecord | UserThemeRecord } {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const isDark =
        currentTheme.colorScheme === 'system'
            ? media.matches
            : currentTheme.colorScheme === 'dark'

    const resolvedId = isDark
        ? currentTheme.darkThemeId
        : currentTheme.lightThemeId
    const resolvedTheme =
        builtinThemes.find(t => t.themeId === resolvedId) ??
        userThemes.find(t => t.themeId === resolvedId) ??
        builtinThemes.at(0)

    if (resolvedTheme == null) {
        throw new Error('There are no themes to resolve from')
    }

    return { isDark, resolvedTheme }
}

const isServer = typeof window === 'undefined'

function clearLegacyTheme(): void {
    try {
        localStorage.removeItem('theme')
    } catch (e) {
        // Unsupported
    }
}

function getLegacyTheme(): 'system' | 'dark' | 'light' | undefined {
    if (isServer) return undefined
    let theme
    try {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        theme = localStorage.getItem('theme') || undefined
    } catch (e) {
        // Unsupported
    }
    return theme as 'system' | 'dark' | 'light'
}

export function ThemeProvider({
    session,
    children,
    builtinThemes: serverRenderedBuiltinThemes,
    userThemes: serverRenderedUserThemes,
    currentTheme: serverRenderedCurrentTheme,
}: {
    children: ReactNode
    session: Session | null
    builtinThemes: BuiltinThemeRecord[]
    userThemes: UserThemeRecord[]
    currentTheme: CurrentTheme | null
}) {
    const userId = session?.user?.id
    const builtinThemes = useQuery({
        queryKey: ['builtinThemes'],
        queryFn: fetchBuiltinThemes,
        initialData: serverRenderedBuiltinThemes,
    })

    const userThemes = useQuery({
        queryKey: ['userThemes'],
        queryFn: fetchUserThemes,
        enabled: Boolean(userId),
        initialData: serverRenderedUserThemes,
    })

    const currentTheme = useQuery({
        queryKey: ['currentTheme'],
        queryFn: fetchCurrentTheme,
        enabled: Boolean(userId),
        initialData: serverRenderedCurrentTheme,
    })

    const queryClient = useQueryClient()

    const setCurrentTheme = useMutation({
        mutationFn: fetchSetCurrentTheme,
        onMutate: async nextCurrentTheme => {
            await queryClient.cancelQueries({ queryKey: ['currentTheme'] })

            const prevCurrentTheme = queryClient.getQueryData(['currentTheme'])

            queryClient.setQueryData(['currentTheme'], nextCurrentTheme)
            applyTheme(nextCurrentTheme)

            return { prevCurrentTheme, nextCurrentTheme }
        },
        onError: (_err, _newTodo, context) => {
            queryClient.setQueryData(
                ['currentTheme'],
                context?.prevCurrentTheme,
            )
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['currentTheme'] }),
    })

    const getCurrentThemeOrLegacy = useMemo<CurrentTheme>(() => {
        const current = currentTheme.data
        if (current) {
            clearLegacyTheme()
            return current
        }

        const legacyTheme = getLegacyTheme()

        const lightThemeId = builtinThemes.data.find(
            t => t.theme.label === 'Light',
        )!.themeId
        const darkThemeId = builtinThemes.data.find(
            t => t.theme.label === 'Dark',
        )!.themeId

        if (legacyTheme === 'light') {
            return {
                userId: '',
                lightThemeId,
                darkThemeId: null,
                colorScheme: legacyTheme,
            }
        }

        if (legacyTheme === 'dark') {
            return {
                userId: '',
                lightThemeId: null,
                darkThemeId,
                colorScheme: legacyTheme,
            }
        }

        return {
            userId: '',
            lightThemeId,
            darkThemeId,
            colorScheme: legacyTheme ?? 'system',
        }
    }, [currentTheme, builtinThemes])

    const applyTheme = useCallback(
        (theme: Omit<CurrentTheme, 'userId'>) => {
            // If theme is system, resolve it before setting theme
            const resolvedTheme = getResolvedTheme(
                theme,
                userThemes.data,
                builtinThemes.data,
            )
            const d = document.documentElement
            d.classList.remove(
                ...builtinThemes.data.map(t => t.themeId),
                ...userThemes.data.map(t => t.themeId),
            )
            d.classList.add(resolvedTheme.resolvedTheme.themeId)

            d.style.colorScheme = resolvedTheme.isDark ? 'dark' : 'light'
        },
        [builtinThemes.data, userThemes.data],
    )

    const handleMediaQuery = useCallback(() => {
        if (getCurrentThemeOrLegacy.colorScheme === 'system') {
            applyTheme(getCurrentThemeOrLegacy)
        }
    }, [getCurrentThemeOrLegacy, applyTheme])

    // Always listen to System preference
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)')

        // Intentionally use deprecated listener methods to support iOS & old browsers
        media.addListener(handleMediaQuery)
        handleMediaQuery()

        return () => media.removeListener(handleMediaQuery)
    }, [handleMediaQuery])

    return (
        <ThemeContext.Provider
            value={{
                themes: [
                    ...builtinThemes.data.map(t => t.theme),
                    ...userThemes.data.map(t => t.theme),
                ],
                currentTheme: getCurrentThemeOrLegacy,
                setTheme: (currentTheme: Omit<CurrentTheme, 'userId'>) => {
                    setCurrentTheme.mutate(currentTheme)
                    applyTheme(currentTheme)
                },
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}
