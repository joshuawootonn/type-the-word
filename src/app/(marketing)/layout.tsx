import { ReactNode } from "react"

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        // Use `typo:` variant so prose styles are in `utilities.typography` and
        // regular utility classes (e.g. `m-0` on headings) can still win.
        <main className="typo:prose dark:typo:prose-invert marker:text-primary typo:prose-headings:text-primary typo:prose-p:text-primary typo:prose-ol:list-[square] typo:prose-ul:list-[square] typo:prose-hr:border-primary relative mx-auto w-full grow pt-4 text-lg lg:pt-8">
            {children}
        </main>
    )
}
