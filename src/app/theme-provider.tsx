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
    BuiltinThemeRecord,
    ThemeRecord,
} from '~/server/repositories/builtinTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'
import { getCurrentThemeOrFallback } from './get-current-theme-or-fallback'
import { idToClassName } from './id-to-className'
import { cleanUpdateDocumentStyles } from '~/components/navigation/create-theme-form'

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
                ...Array.from(d.classList.values()).filter(c => {
                    return c.startsWith('theme-')
                }),
            )
            d.classList.add(idToClassName(resolvedTheme.resolvedTheme.themeId))

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
            const { userId, ...currentTheme } = currentThemeOrFallback
            setCurrentTheme.mutate(currentTheme)
            hasUpdatedCurrentTheme.current = true
        }
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
