// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: 'https://cbbe511a85f3f2594b9b683fe03d9e39@o4507503635529728.ingest.us.sentry.io/4507503640051712',

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    enabled: process.env.NODE_ENV === 'production',
    // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: process.env.NODE_ENV === 'development',
})
