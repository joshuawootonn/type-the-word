import { memo } from 'react'
import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'

// The functions below are similar to 'get-current-theme-or-fallback'
// The only difference is these functions are `toString`'d into a script for server rendering

export const script = (
    currentTheme: CurrentTheme | null,
    builtinThemes: BuiltinThemeRecord[],
    themes: string[],
) => {
    const el = document.documentElement

    function clearLegacyTheme() {
        try {
            localStorage.removeItem('theme')
        } catch (e) {
            console.warn('threw in clear')
        }
    }

    function getLegacyTheme() {
        let theme
        try {
            theme = localStorage.getItem('theme') ?? undefined
        } catch (e) {
            console.warn('threw in get')
        }
        return theme as 'system' | 'dark' | 'light' | undefined
    }

    function getCurrentThemeOrFallback(
        current: CurrentTheme | null,
        builtinThemes: BuiltinThemeRecord[],
    ): CurrentTheme {
        if (current) {
            clearLegacyTheme()
            return current
        }

        const legacyTheme = getLegacyTheme()

        const lightThemeId = builtinThemes.find(
            t => t.theme.label === 'Light',
        )!.themeId
        const darkThemeId = builtinThemes.find(
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
    }

    function setColorScheme() {
        el.style.colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light'
    }

    function updateDOM(themeId: string) {
        el.classList.remove(...themes)
        el.classList.add(`theme-${themeId}`)
    }

    function getResolvedThemeId(): string {
        const currentThemeOrFallback = getCurrentThemeOrFallback(
            currentTheme,
            builtinThemes,
        )

        if (currentThemeOrFallback.colorScheme === 'light')
            return currentThemeOrFallback.lightThemeId
        if (currentThemeOrFallback.colorScheme === 'dark')
            return currentThemeOrFallback.darkThemeId

        const resolvedThemeId = window.matchMedia(
            '(prefers-color-scheme: dark)',
        ).matches
            ? currentThemeOrFallback.darkThemeId
            : currentThemeOrFallback.lightThemeId

        return resolvedThemeId
    }

    try {
        updateDOM(getResolvedThemeId())
        setColorScheme()
    } catch (e) {
        //
    }
}

export const ThemeScript = memo(function ThemeScript(props: {
    userThemes: UserThemeRecord[]
    builtinThemes: BuiltinThemeRecord[]
    currentTheme: CurrentTheme | null
}) {
    const scriptArgs = JSON.stringify([
        props.currentTheme,
        props.builtinThemes,
        [
            ...props.builtinThemes.map(t => t.themeId),
            ...props.userThemes.map(t => t.themeId),
        ],
    ]).slice(1, -1)

    return (
        <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
                __html: `(${script.toString()})(${scriptArgs})`,
            }}
        />
    )
})
