import type { ReactElement, ReactNode } from "react"

import { BackToMainLink } from "~/components/docs/back-to-main-link"
import { DocsLogo } from "~/components/docs/docs-logo"
import { DocsNavLinks } from "~/components/docs/docs-nav-links"
import { MobileSidebarDialog } from "~/components/docs/mobile-sidebar-dialog"
import { docsNavigation } from "~/lib/docs/navigation"

export default function DocsRouteLayout({
    children,
}: {
    children: ReactNode
}): ReactElement {
    return (
        <div data-docs-layout className="w-full">
            <div className="mx-auto grid w-full grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)]">
                <aside className="bg-primary/3 border-primary/5 sticky top-0 hidden h-dvh border-r-2 md:flex md:flex-col">
                    <div className="p-4">
                        <DocsLogo />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <DocsNavLinks items={docsNavigation} />
                    </div>
                    <div className="p-4">
                        <BackToMainLink />
                    </div>
                </aside>

                <section className="min-w-0">
                    <header className="bg-secondary border-primary/5 sticky top-0 z-30 border-b-2 md:hidden">
                        <div className="bg-primary/3 mx-auto flex w-full items-center justify-between p-4">
                            <DocsLogo />
                            <MobileSidebarDialog items={docsNavigation} />
                        </div>
                    </header>
                    <div className="mx-auto flex w-full flex-col">
                        <main>{children}</main>
                    </div>
                </section>
            </div>
        </div>
    )
}
