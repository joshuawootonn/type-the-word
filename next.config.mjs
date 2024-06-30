import { withSentryConfig } from '@sentry/nextjs'
import { env } from './src/env.mjs'

await import('./src/env.mjs')

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,
    experimental: {
        instrumentationHook: true,
    },
    i18n: {
        locales: ['en'],
        defaultLocale: 'en',
    },
}

export default withSentryConfig(config, {
    org: 'type-the-word',
    project: 'typetheword-site',

    authToken: env.SENTRY_AUTH_TOKEN,

    silent: false, // Can be used to suppress logs
})
