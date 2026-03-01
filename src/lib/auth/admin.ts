import { env } from "~/env.mjs"

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
}

function getAdminEmails(): Set<string> {
    return new Set(
        env.ADMIN_EMAIL_WHITELIST.split(",")
            .map(normalizeEmail)
            .filter(Boolean),
    )
}

export function isAdminEmail(email?: string | null): boolean {
    if (email == null || email.trim() === "") {
        return false
    }

    const adminEmails = getAdminEmails()
    return adminEmails.has(normalizeEmail(email))
}
