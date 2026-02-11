import { uuidToThemeClassname } from "~/lib/theme/dom"
import {
    BuiltinThemeRecord,
    ThemeRecord,
} from "~/server/repositories/builtinTheme.repository"
import { UserThemeRecord } from "~/server/repositories/userTheme.repository"

export function themeCSS({ theme }: { theme: ThemeRecord }): string {
    return `
.${uuidToThemeClassname(theme.id)} {
  --oklch-primary: ${theme.primaryLightness}% ${theme.primaryChroma} ${theme.primaryHue};
  --oklch-secondary: ${theme.secondaryLightness}% ${theme.secondaryChroma} ${theme.secondaryHue};
  --oklch-success: ${theme.successLightness}% ${theme.successChroma} ${theme.successHue};
  --oklch-error: ${theme.errorLightness}% ${theme.errorChroma} ${theme.errorHue};
}
`
}

export function ThemeStyles({
    builtinThemes,
    userThemes,
}: {
    builtinThemes: BuiltinThemeRecord[]
    userThemes: UserThemeRecord[]
}) {
    return (
        <style id="themes" suppressHydrationWarning>{`
            ${[...builtinThemes, ...userThemes].map(t => themeCSS({ theme: t.theme })).join("")}
        `}</style>
    )
}
