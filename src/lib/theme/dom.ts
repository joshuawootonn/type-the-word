import { themeCSS } from "~/app/theme-styles"
import { ThemeRecord } from "~/server/repositories/builtinTheme.repository"

export const THEME_PREFIX = "theme-"

export function uuidToThemeClassname(id: string) {
    return `${THEME_PREFIX}${id.toLowerCase()}`
}
export function isThemeClassname(className: string) {
    return className.startsWith(THEME_PREFIX)
}

export function cleanUpdateDocumentStyles() {
    document.documentElement.style.removeProperty(`--oklch-primary`)
    document.documentElement.style.removeProperty(`--oklch-secondary`)
    document.documentElement.style.removeProperty(`--oklch-success`)
    document.documentElement.style.removeProperty(`--oklch-error`)
}

export function injectNewClassIntoStyle(theme: ThemeRecord) {
    const el = document.getElementById("themes")

    if (el == null) return

    el.innerHTML += themeCSS({ theme })
}

export function getCSSVarValue(varName: string) {
    return window
        .getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
}
