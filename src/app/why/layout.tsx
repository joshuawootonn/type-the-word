import { ReactNode } from 'react'

export default function PassageLayout({ children }: { children: ReactNode }) {
    return (
        <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert prose-headings:text-primary prose-p:text-primary lg:pt-8">
            {children}
        </main>
    )
}
