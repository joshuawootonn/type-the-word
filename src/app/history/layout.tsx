import { ReactNode } from 'react'

export default function PassageLayout({ children }: { children: ReactNode }) {
    return (
        <main className="prose mx-auto mb-8 w-full flex-grow pt-4 text-lg text-primary dark:prose-invert prose-headings:text-primary prose-p:text-primary lg:pt-8">
            <h1 className="">History</h1>
            {children}
        </main>
    )
}
