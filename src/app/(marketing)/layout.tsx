import { ReactNode } from "react"

import { Footer } from "~/components/footer"
import { Navigation } from "~/components/navigation/navigation"
import { getNavigationShellProps } from "~/lib/getNavigationShellProps"

export default async function MarketingLayout({
    children,
}: {
    children: ReactNode
}) {
    const navigationProps = await getNavigationShellProps()

    return (
        <div className="max-w-page container mx-auto flex w-full flex-col px-4 lg:px-0">
            <Navigation {...navigationProps} />
            {/* Use `typo:` variant so prose styles are in `utilities.typography` and
            regular utility classes (e.g. `m-0` on headings) can still win. */}
            <main className="typo:prose dark:typo:prose-invert marker:text-primary typo:prose-headings:text-primary typo:prose-p:text-primary typo:prose-ol:list-[square] typo:prose-ul:list-[square] typo:prose-hr:border-primary relative mx-auto w-full grow pt-4 text-lg lg:pt-8">
                {children}
            </main>
            <Footer />
        </div>
    )
}
