export type E2eUser = {
    firstName: string
    email: string
    password: string
}

export function createE2eUser(): E2eUser {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return {
        firstName: "E2E",
        email: `e2e-${nonce}@example.com`,
        password: "Playwright!123",
    }
}
