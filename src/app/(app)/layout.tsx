import { ReactNode } from "react"

import { Footer } from "~/components/footer"
import { Navigation } from "~/components/navigation/navigation"
import { getNavigationShellProps } from "~/lib/getNavigationShellProps"

export default async function AppLayout({ children }: { children: ReactNode }) {
    const navigationProps = await getNavigationShellProps()

    return (
        <div className="max-w-page container mx-auto flex w-full flex-col px-4 lg:px-0">
            <Navigation {...navigationProps} />
            {children}
            <Footer />
        </div>
    )
}
