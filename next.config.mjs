import { withSentryConfig } from "@sentry/nextjs"
import path from "path"
import { fileURLToPath } from "url"

import { env } from "./src/env.mjs"

await import("./src/env.mjs")

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,
    outputFileTracingRoot: __dirname,
    turbopack: {},
    // eslint-disable-next-line @typescript-eslint/require-await
    async rewrites() {
        return [
            {
                source: "/ingest/static/:path*",
                destination: "https://us-assets.i.posthog.com/static/:path*",
            },
            {
                source: "/ingest/:path*",
                destination: "https://us.i.posthog.com/:path*",
            },
        ]
    },
    skipTrailingSlashRedirect: true,
}

export default withSentryConfig(config, {
    org: "type-the-word",
    project: "typetheword-site",

    authToken: env.SENTRY_AUTH_TOKEN,

    silent: false, // Can be used to suppress logs
})
