import { defineConfig, devices } from "@playwright/test"

const appPort = Number(process.env.APP_PORT ?? "1199")
const e2ePort = Number(process.env.E2E_APP_PORT ?? `${appPort + 9}`)
const e2eBaseUrl = `http://localhost:${e2ePort}`

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: false,
    retries: 0,
    workers: 1,
    reporter: "list",
    use: {
        baseURL: e2eBaseUrl,
        trace: "on-first-retry",
    },
    webServer: {
        command: `E2E_MOCK_PASSAGE=1 E2E_MOCK_POSTHOG=1 E2E_MOCK_CONVERTKIT=1 NEXTAUTH_SECRET=e2e-local-secret NEXTAUTH_URL=${e2eBaseUrl} BETTER_AUTH_URL=${e2eBaseUrl} DEPLOYED_URL=${e2eBaseUrl} pnpm exec next dev -p ${e2ePort}`,
        url: `${e2eBaseUrl}/auth/login`,
        reuseExistingServer: false,
        timeout: 120 * 1000,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
})
