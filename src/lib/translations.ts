import { z } from "zod"

import { Translation } from "~/lib/parseEsv"

export type TranslationOption = { value: Translation; label: string }

/**
 * All supported Bible translations
 */
export const allTranslations: TranslationOption[] = [
    { value: "esv", label: "ESV" },
    { value: "bsb", label: "BSB" },
    { value: "nlt", label: "NLT" },
    { value: "niv", label: "NIV" },
    { value: "csb", label: "CSB" },
    { value: "nkjv", label: "NKJV" },
    { value: "nasb", label: "NASB" },
    { value: "ntv", label: "NTV" },
    { value: "msg", label: "MSG" },
]

/**
 * Default translation (ESV only) - used when API.Bible feature flag is disabled
 */
export const defaultTranslations: TranslationOption[] = [
    { value: "esv", label: "ESV" },
]

/**
 * Valid translation values for validation
 */
export const validTranslations = allTranslations.map(t => t.value)

/**
 * Zod schema for translation validation
 */
export const translationSchema = z.enum([
    "esv",
    "bsb",
    "nlt",
    "niv",
    "csb",
    "nkjv",
    "nasb",
    "ntv",
    "msg",
])

/**
 * Try to parse a translation, returning null if invalid
 */
export function tryParseTranslation(
    value: string | undefined | null,
): Translation | null {
    const result = translationSchema.safeParse(value)
    return result.success ? result.data : null
}

/**
 * Parse a translation string safely with Zod, defaulting to ESV if invalid
 */
export function parseTranslation(
    value: string | undefined | null,
): Translation {
    return tryParseTranslation(value) ?? "esv"
}

/**
 * Check if a value is a valid translation (type guard)
 */
export function isValidTranslation(
    value: string | undefined | null,
): value is Translation {
    return tryParseTranslation(value) !== null
}

/**
 * Zod schema for history translation filter (defaults to ESV)
 * @deprecated Use parseTranslation instead
 */
export const historyTranslationSchema = translationSchema.catch("esv")

export type HistoryTranslation = z.infer<typeof translationSchema>
