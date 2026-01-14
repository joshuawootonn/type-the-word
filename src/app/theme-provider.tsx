import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Session } from 'next-auth'
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from 'react'

import {
    fetchBuiltinThemes,
    fetchCurrentTheme,
    fetchSetCurrentTheme,
    fetchUserThemes,
} from '~/lib/api'
import {
    cleanUpdateDocumentStyles,
    uuidToThemeClassname,
    isThemeClassname,
} from '~/lib/theme/dom'
import { isThemeDark } from '~/lib/theme/lch'
import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'

import { getCurrentThemeOrFallback } from '../lib/theme/get-current-theme-or-fallback'
import { themeCSS } from './theme-styles'

const ThemeContext = createContext<{
    currentTheme: CurrentTheme
    setTheme: (currentTheme: Omit<CurrentTheme, 'userId'>) => void
}>({
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

export function getResolvedTheme(
    currentTheme: Omit<CurrentTheme, 'userId'>,
    userThemes: UserThemeRecord[],
    builtinThemes: BuiltinThemeRecord[],
): { isDark: boolean; resolvedTheme: BuiltinThemeRecord | UserThemeRecord } {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const isDarkId =
        currentTheme.colorScheme === 'system'
            ? media.matches
            : currentTheme.colorScheme === 'dark'

    const resolvedId = isDarkId
        ? currentTheme.darkThemeId
        : currentTheme.lightThemeId
    const resolvedTheme =
        builtinThemes.find(t => t.themeId === resolvedId) ??
        userThemes.find(t => t.themeId === resolvedId) ??
        builtinThemes.at(0)

    if (resolvedTheme == null) {
        throw new Error('There are no themes to resolve from')
    }

    const isDark =
        currentTheme.colorScheme === 'system'
            ? media.matches
            : isThemeDark(resolvedTheme.theme)

    return { isDark, resolvedTheme }
}

export function getDarkTheme(
    currentTheme: Omit<CurrentTheme, 'userId'>,
    userThemes: UserThemeRecord[],
    builtinThemes: BuiltinThemeRecord[],
): BuiltinThemeRecord | UserThemeRecord {
    const resolvedId = currentTheme.darkThemeId
    const resolvedTheme =
        builtinThemes.find(t => t.themeId === resolvedId) ??
        userThemes.find(t => t.themeId === resolvedId) ??
        builtinThemes.find(t => t.theme.label === 'Dark')

    if (resolvedTheme == null) {
        throw new Error('There are no light themes to resolve from')
    }

    return resolvedTheme
}

export function getLightTheme(
    currentTheme: Omit<CurrentTheme, 'userId'>,
    userThemes: UserThemeRecord[],
    builtinThemes: BuiltinThemeRecord[],
): BuiltinThemeRecord | UserThemeRecord {
    const resolvedId = currentTheme.lightThemeId
    const resolvedTheme =
        builtinThemes.find(t => t.themeId === resolvedId) ??
        userThemes.find(t => t.themeId === resolvedId) ??
        builtinThemes.find(t => t.theme.label === 'Light')

    if (resolvedTheme == null) {
        throw new Error('There are no light themes to resolve from')
    }

    return resolvedTheme
}

export function updateThemeStyleTag(
    builtinThemes: BuiltinThemeRecord[],
    userThemes: UserThemeRecord[],
) {
    const themeStyleTag = document.getElementById('themes')
    if (themeStyleTag) {
        themeStyleTag.innerHTML = [...builtinThemes, ...userThemes]
            .map(t => themeCSS({ theme: t.theme }))
            .join('')
    }
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

    // Update theme styles when builtin or user themes change (replaces v4's onSuccess)
    useEffect(() => {
        updateThemeStyleTag(builtinThemes.data, userThemes.data)
    }, [builtinThemes.data, userThemes.data])

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

    const currentThemeOrFallback = useMemo<CurrentTheme>(() => {
        return getCurrentThemeOrFallback(currentTheme.data, builtinThemes.data)
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
                ...Array.from(d.classList.values()).filter(isThemeClassname),
            )
            d.classList.add(
                uuidToThemeClassname(resolvedTheme.resolvedTheme.themeId),
            )

            d.style.colorScheme = resolvedTheme.isDark ? 'dark' : 'light'
        },
        [builtinThemes.data, userThemes.data],
    )

    const hasUpdatedCurrentTheme = useRef(false)

    useEffect(() => {
        // todo(josh): remove this after January 2024.
        // This function sets the currentTheme based on the legacy `localstorage` version of themes.
        // Even if users don't manually set a theme I want to start migrating users to db based themes,
        // so I can eventually delete the legacy code without impacting active users.
        if (
            session?.user.id &&
            currentTheme.data == null &&
            !hasUpdatedCurrentTheme.current
        ) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { userId, ...currentTheme } = currentThemeOrFallback
            setCurrentTheme.mutate(currentTheme)
            hasUpdatedCurrentTheme.current = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleMediaQuery = useCallback(() => {
        applyTheme(currentThemeOrFallback)
    }, [currentThemeOrFallback, applyTheme])

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
                currentTheme: currentThemeOrFallback,
                setTheme: (currentTheme: Omit<CurrentTheme, 'userId'>) => {
                    setCurrentTheme.mutate(currentTheme)
                    cleanUpdateDocumentStyles()
                    applyTheme(currentTheme)
                },
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}
