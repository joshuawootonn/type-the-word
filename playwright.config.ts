import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:1200",
        trace: "on-first-retry",
    },
    webServer: {
        command: "E2E_MOCK_PASSAGE=1 E2E_MOCK_POSTHOG=1 pnpm exec next dev -p 1200",
        url: "http://127.0.0.1:1200/auth/login",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
})
