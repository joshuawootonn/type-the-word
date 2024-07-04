import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    /**
     * Specify your server-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars.
     */
    server: {
        POSTGRES_DATABASE_URL: z
            .string()
            .url()
            .refine(
                str => !str.includes('YOUR_POSTGRES_URL_HERE'),
                'You forgot to change the default URL',
            ),
        NODE_ENV: z
            .enum(['development', 'test', 'production'])
            .default('development'),
        CROSSWAY_SECRET: z.string(),
        // NEXTAUTH_SECRET:
        //   process.env.NODE_ENV === "production"
        //     ? z.string().min(1)
        //     : z.string().min(1).optional(),
        // NEXTAUTH_URL: z.preprocess(
        //   // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
        //   // Since NextAuth.js automatically uses the VERCEL_URL if present.
        //   (str) => process.env.VERCEL_URL ?? str,
        //   // VERCEL_URL doesn't include `https` so it cant be validated as a URL
        //   process.env.VERCEL ? z.string().min(1) : z.string().url()
        // ),
        // // Add `.min(1) on ID and SECRET if you want to make sure they're not empty
        // DISCORD_CLIENT_ID: z.string(),
        // DISCORD_CLIENT_SECRET: z.string(),
        GOOGLE_CLIENT_ID: z.string(),
        GOOGLE_CLIENT_SECRET: z.string(),
        SENTRY_AUTH_TOKEN: z.string(),

        CONVERTKIT_API_KEY: z.string(),
        CONVERTKIT_SUBSCRIBE_FORM_ID: z.string(),
    },

    /**
     * Specify your client-side environment variables schema here. This way you can ensure the app
     * isn't built with invalid env vars. To expose them to the client, prefix them with
     * `NEXT_PUBLIC_`.
     */
    client: {
        // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
        NEXT_PUBLIC_FATHOM_ID: z.string(),
    },

    /**
     * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
     * middlewares) or client-side so we need to destruct manually.
     */
    runtimeEnv: {
        POSTGRES_DATABASE_URL: process.env.POSTGRES_DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        CROSSWAY_SECRET: process.env.CROSSWAY_SECRET,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        // NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        // NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        // DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
        // DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
        NEXT_PUBLIC_FATHOM_ID: process.env.NEXT_PUBLIC_FATHOM_ID,
        SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
        CONVERTKIT_API_KEY: process.env.CONVERTKIT_API_KEY,
        CONVERTKIT_SUBSCRIBE_FORM_ID: process.env.CONVERTKIT_SUBSCRIBE_FORM_ID,
    },
    /**
     * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
     * useful for Docker builds.
     */
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
