import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { eq } from "drizzle-orm"
import { type GetServerSidePropsContext } from "next"
import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

import { env } from "~/env.mjs"
import { verifyPassword } from "~/lib/auth/password"
import { createSubscription } from "~/lib/convert-kit.service"
import { db } from "~/server/db"
import { users, accounts } from "~/server/db/schema"

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        sub?: string
    }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            // Prevent account linking - check if user is trying to sign in with a different auth type
            if (account?.provider === "google") {
                // Check if this email already has a credentials account
                const existingUser = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, user.email ?? ""))
                    .limit(1)

                if (
                    existingUser.length > 0 &&
                    existingUser[0]?.hashedPassword
                ) {
                    // User has credentials account, don't allow Google sign-in
                    return false
                }
            }

            return true
        },
        session: ({ session, token }) => {
            // For credentials provider, user comes from token
            if (token?.sub) {
                return {
                    ...session,
                    user: {
                        ...session.user,
                        id: token.sub,
                    },
                }
            }

            return session
        },
        jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id
            }
            return token
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
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                // Find user by email
                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, credentials.email))
                    .limit(1)

                if (user.length === 0 || !user[0]) {
                    return null
                }

                const dbUser = user[0]

                // Check if user has a password (not OAuth-only user)
                if (!dbUser.hashedPassword) {
                    return null
                }

                // Check if user has any OAuth accounts - prevent account linking
                const oauthAccounts = await db
                    .select()
                    .from(accounts)
                    .where(eq(accounts.userId, dbUser.id))
                    .limit(1)

                if (oauthAccounts.length > 0) {
                    // User has OAuth account, don't allow credentials log in
                    return null
                }

                // Verify password
                const isValidPassword = await verifyPassword(
                    credentials.password,
                    dbUser.hashedPassword,
                )

                if (!isValidPassword) {
                    return null
                }

                return {
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name,
                    image: dbUser.image,
                }
            },
        }),
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
    req: GetServerSidePropsContext["req"]
    res: GetServerSidePropsContext["res"]
}) => {
    return getServerSession(ctx.req, ctx.res, authOptions)
}
