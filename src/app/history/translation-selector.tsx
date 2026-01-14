'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import {
    allTranslations,
    historyTranslationSchema,
    HistoryTranslation,
} from '~/lib/translations'

export function TranslationSelector() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentTranslation: HistoryTranslation =
        historyTranslationSchema.parse(searchParams?.get('translation'))

    const handleChange = useCallback(
        (value: string) => {
            // Set cookie to remember translation preference
            void fetch('/api/set-translation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ translation: value }),
            })

            // Update URL
            const params = new URLSearchParams(searchParams?.toString() ?? '')
            params.set('translation', value)
            router.push(`${pathname}?${params.toString()}`)
        },
        [router, pathname, searchParams],
    )

    return (
        <div className="flex items-center gap-2 text-sm text-primary">
            <span>Translation:</span>
            <Select value={currentTranslation} onValueChange={handleChange}>
                <SelectTrigger className="min-w-[80px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {allTranslations.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
