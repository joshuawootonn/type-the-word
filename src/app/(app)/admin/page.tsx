import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { isAdminEmail } from "~/lib/auth/admin"
import { authOptions } from "~/server/auth"

import { ClientPage } from "./client-page"

export default async function AdminPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/auth/login?callbackUrl=%2Fadmin")
    }

    if (!isAdminEmail(session.user.email)) {
        return (
            <main className="typo:prose text-primary dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary mx-auto mb-8 w-full grow pt-4 text-lg lg:pt-8">
                <h1>Admin</h1>
                <p>You do not have access to this page.</p>
            </main>
        )
    }

    return (
        <main className="typo:prose text-primary dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary mx-auto mb-8 w-full grow pt-4 text-lg lg:pt-8">
            <h1>Admin</h1>
            <ClientPage />
        </main>
    )
}
