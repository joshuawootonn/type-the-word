export type E2eUser = {
    firstName: string
    email: string
    password: string
}

export function createE2eUser(domain = "example.com"): E2eUser {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const resolvedDomain =
        domain === "example.com" ? `org-${nonce}.example.com` : domain
    return {
        firstName: "E2E",
        email: `e2e-${nonce}@${resolvedDomain}`,
        password: "Playwright!123",
    }
}
