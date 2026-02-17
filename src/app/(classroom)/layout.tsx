import { ReactNode } from "react"

import { Footer } from "~/components/footer"
import { Navigation } from "~/components/navigation/navigation"
import { getNavigationShellProps } from "~/lib/getNavigationShellProps"

export default async function ClassroomRouteGroupLayout({
    children,
}: {
    children: ReactNode
}) {
    const navigationProps = await getNavigationShellProps()

    return (
        <div className="mx-auto flex w-full max-w-(--classroom-content-max-width) flex-col px-4 lg:px-0">
            <Navigation {...navigationProps} />
            <main className="typo:prose text-primary marker:text-primary typo:prose-headings:text-primary typo:prose-p:text-pretty typo:prose-p:text-primary relative mb-16 w-full max-w-full grow pt-4 text-lg lg:pt-8">
                {children}
            </main>
            <Footer />
        </div>
    )
}
