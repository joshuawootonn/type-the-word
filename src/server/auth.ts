import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { type GetServerSidePropsContext } from 'next'
import {
    getServerSession,
    type DefaultSession,
    type NextAuthOptions,
} from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { env } from '~/env.mjs'
import { createSubscription } from '~/lib/convert-kit.service'
import { db } from '~/server/db'

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string
            // ...other properties
            // role: UserRole;
        } & DefaultSession['user']
    }

    // interface User {
    //   // ...other properties
    //   // role: UserRole;
    // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
    callbacks: {
        session: ({ session, user }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: user.id,
                },
            }
        },
    },
    events: {
        createUser: async ({ user }) => {
            if (user.email == null || user.name == null) {
                console.warn(
                    `Did not create subscription for user ${user.id} because email: ${user.email} / name: ${user.name} was nullish.`,
                )

                return
            }

            await createSubscription({ email: user.email, name: user.name })
        },
    },
    adapter: DrizzleAdapter(db),
    providers: [
        // DiscordProvider({
        //   clientId: env.DISCORD_CLIENT_ID,
        //   clientSecret: env.DISCORD_CLIENT_SECRET,
        // }),
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),

        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
    ],
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
    req: GetServerSidePropsContext['req']
    res: GetServerSidePropsContext['res']
}) => {
    return getServerSession(ctx.req, ctx.res, authOptions)
}
