import { Navigation } from '~/components/navigation'
import { ReactNode } from 'react'

export default function PassageLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <Navigation />
            <main className="prose mx-auto mb-8 w-full flex-grow pt-4 text-lg dark:prose-invert dark:text-white lg:pt-8">
                <h1 className="">History</h1>
                <hr className="mx-0 w-full border-t-2 border-black dark:border-white dark:text-white" />
                {children}
            </main>
        </>
    )
}
