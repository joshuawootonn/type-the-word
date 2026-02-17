import createMDX from "@next/mdx"
import { withSentryConfig } from "@sentry/nextjs"
import path from "path"
import { fileURLToPath } from "url"

import { env } from "./src/env.mjs"

await import("./src/env.mjs")

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isE2EMode =
    process.env.E2E_MOCK_PASSAGE === "1" ||
    process.env.E2E_MOCK_POSTHOG === "1" ||
    process.env.E2E_MOCK_CONVERTKIT === "1"

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,
    pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
    outputFileTracingRoot: __dirname,
    distDir: isE2EMode ? ".next-e2e" : ".next",
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

const withMDX = createMDX({
    options: {
        // Turbopack-compatible plugin declaration uses string names.
        remarkPlugins: ["remark-gfm"],
        rehypePlugins: [
            "rehype-slug",
            "@stefanprobst/rehype-extract-toc",
            ["@stefanprobst/rehype-extract-toc/mdx", { name: "toc" }],
        ],
    },
})

export default withSentryConfig(withMDX(config), {
    org: "type-the-word",
    project: "typetheword-site",

    authToken: env.SENTRY_AUTH_TOKEN,

    silent: false, // Can be used to suppress logs
})
