import type { ReactElement, ReactNode } from "react"

import { DocsLogo } from "~/components/docs/docs-logo"
import { DocsNavLinks } from "~/components/docs/docs-nav-links"
import { MobileSidebarDialog } from "~/components/docs/mobile-sidebar-dialog"
import { Link } from "~/components/ui/link"
import { docsNavigation } from "~/lib/docs/navigation"

export default function DocsRouteLayout({
    children,
}: {
    children: ReactNode
}): ReactElement {
    return (
        <div data-docs-layout className="w-full">
            <div className="mx-auto grid w-full grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)]">
                <aside className="bg-primary/3 sticky border-primary/5 border-r-2 top-0 hidden h-dvh md:flex md:flex-col">
                    <div className="p-4">
                        <DocsLogo />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <DocsNavLinks items={docsNavigation} />
                    </div>
                    <div className="border-primary p-4">
                        <Link href="/">Back to main site</Link>
                    </div>
                </aside>

                <section className="min-w-0">
                    <header className="border-primary bg-secondary sticky top-0 z-30 flex items-center justify-between border-b-2 p-3 md:hidden">
                        <DocsLogo />
                        <MobileSidebarDialog items={docsNavigation} />
                    </header>
                    <div className="mx-auto flex w-full flex-col px-4 lg:px-0">
                        <main>{children}</main>
                    </div>
                </section>
            </div>
        </div>
    )
}
