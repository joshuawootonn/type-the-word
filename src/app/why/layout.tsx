import { ReactNode } from "react"

export default function PassageLayout({ children }: { children: ReactNode }) {
    return (
        <main className="typo:prose dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary relative mx-auto w-full grow pt-4 text-lg lg:pt-8">
            {children}
        </main>
    )
}
