import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'

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

export function getCurrentThemeOrFallback(
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
