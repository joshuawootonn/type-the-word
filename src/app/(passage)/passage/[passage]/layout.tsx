import { ReactNode } from 'react'
import { passageReferenceSchema } from '~/lib/passageReference'
import { PassageSelector } from '~/components/passageSelector'

const DEFAULT_PASSAGE_REFERENCE = 'psalm_23'

export default function PassageLayout({
    children,
    params,
}: {
    children: ReactNode
    params: { passage?: string }
}) {
    const value = passageReferenceSchema.parse(
        params?.passage ?? DEFAULT_PASSAGE_REFERENCE,
    )
    return (
        <>
            <div className="prose mx-auto mb-8 flex w-full items-center justify-start space-x-3 pt-4 lg:pt-8">
                <PassageSelector
                    value={value}
                    labelClassName="text-lg font-medium text-primary"
                />
            </div>
            <main className="relative mx-auto w-full flex-grow">
                <div className="bg-primary p-4 text-secondary">
                    Hi everyone Logging into TTW is broken currently. Working on
                    this now.
                </div>
                {children}
            </main>
        </>
    )
}
