import { ThemeRecord } from '~/server/repositories/builtinTheme.repository'

export function isThemeDark(theme: ThemeRecord) {
    return theme.primaryLightness > 50
}
