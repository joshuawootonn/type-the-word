import { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert marker:text-primary prose-headings:text-primary prose-p:text-primary prose-hr:border-primary lg:pt-8">
            {children}
        </main>
    )
}
