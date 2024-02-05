await import('./src/env.mjs')

import { withAxiom } from 'next-axiom'

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,
    experimental: {
        instrumentationHook: true
    },
    i18n: {
        locales: ['en'],
        defaultLocale: 'en',
    },
}

export default withAxiom(config)
