import { z } from "zod"

import { ThemeRecord } from "~/server/repositories/builtinTheme.repository"

export function isThemeDark(theme: ThemeRecord) {
    return theme.primaryLightness > 50
}

export function stringToOKLCH(s: string): {
    lightness: number
    chroma: number
    hue: number
} {
    const components = s.split(" ")

    return {
        lightness: parseFloat(components.at(0)!.replace("%", "")),
        chroma: parseFloat(components.at(1)!),
        hue: parseFloat(components.at(2)!),
    }
}

export function oklchToString(oklch: {
    lightness: number
    chroma: number
    hue: number
}) {
    return `${oklch.lightness}% ${oklch.chroma} ${oklch.hue}`
}

const oklchObjectSchema = z.object({
    lightness: z.number(),
    chroma: z.number(),
    hue: z.number(),
})

export const oklchSchema = z.string().refine(stringLCHValue => {
    const objectLCHValue = stringToOKLCH(stringLCHValue)
    const result = oklchObjectSchema.safeParse(objectLCHValue)

    return result.success
})
