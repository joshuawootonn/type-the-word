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

export default config
