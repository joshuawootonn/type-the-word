import React from 'react'

export const script = (currentThemes: [string, string], themes: string[]) => {
    const el = document.documentElement

    function setColorScheme() {
        el.style.colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light'
    }

    function updateDOM(theme: string) {
        const classes = themes
        el.classList.remove(...classes)
        el.classList.add(theme)

        setColorScheme()
    }

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? currentThemes[1]
            : currentThemes[0]
    }

    try {
        updateDOM(getSystemTheme())
    } catch (e) {
        //
    }
}

export const ThemeScript = React.memo(function ThemeScript({
    theme,
    currentThemes,
    themes,
}: {
    currentThemes: string[]
    themes: string[]
    theme: string
}) {
    const scriptArgs = JSON.stringify([theme, currentThemes, themes]).slice(
        1,
        -1,
    )

    return (
        <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
                __html: `(${script.toString()})(${scriptArgs})`,
            }}
        />
    )
})
