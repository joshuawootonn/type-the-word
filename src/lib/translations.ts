import { z } from 'zod'

import { Translation } from '~/lib/parseEsv'

export type TranslationOption = { value: Translation; label: string }

/**
 * All supported Bible translations
 */
export const allTranslations: TranslationOption[] = [
    { value: 'esv', label: 'ESV' },
    { value: 'bsb', label: 'BSB' },
    { value: 'nlt', label: 'NLT' },
    { value: 'niv', label: 'NIV' },
    { value: 'csb', label: 'CSB' },
    { value: 'nkjv', label: 'NKJV' },
    { value: 'nasb', label: 'NASB' },
    { value: 'ntv', label: 'NTV' },
    { value: 'msg', label: 'MSG' },
]

/**
 * Default translation (ESV only) - used when API.Bible feature flag is disabled
 */
export const defaultTranslations: TranslationOption[] = [
    { value: 'esv', label: 'ESV' },
]

/**
 * Valid translation values for validation
 */
export const validTranslations = allTranslations.map(t => t.value)

/**
 * Zod schema for history translation filter (defaults to ESV)
 */
export const historyTranslationSchema = z
    .enum(['esv', 'bsb', 'nlt', 'niv', 'csb', 'nkjv', 'nasb', 'ntv', 'msg'])
    .catch('esv')

export type HistoryTranslation = z.infer<typeof historyTranslationSchema>
