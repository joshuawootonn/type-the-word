'use client'

import { Navigation } from '~/components/navigation'
import { useParams } from 'next/navigation'
import { ReactNode } from 'react'
import { passageReferenceSchema } from '~/lib/passageReference'
import { PassageSelector } from '~/components/passageSelector'

const DEFAULT_PASSAGE_REFERENCE = 'psalm_23'

export default function PassageLayout({ children }: { children: ReactNode }) {
    const params = useParams<{ passage: string }>()
    const value = passageReferenceSchema.parse(
        params?.passage ?? DEFAULT_PASSAGE_REFERENCE,
    )
    return (
        <>
            <Navigation />
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-4 lg:pt-8">
                <PassageSelector value={value} />
            </div>
            {children}
        </>
    )
}
