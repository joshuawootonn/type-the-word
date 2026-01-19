import { randomBytes } from "crypto"
import { eq, and, gt } from "drizzle-orm"

import { db } from "~/server/db"
import { verificationTokens } from "~/server/db/schema"

const TOKEN_EXPIRY_HOURS = 24

export function generateResetToken(): string {
    return randomBytes(32).toString("hex")
}

export async function createResetToken(email: string): Promise<string> {
    const token = generateResetToken()
    const expires = new Date()
    expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS)

    // Delete any existing tokens for this email
    await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, `password-reset:${email}`))

    // Create new token
    await db.insert(verificationTokens).values({
        identifier: `password-reset:${email}`,
        token,
        expires,
    })

    return token
}

export async function verifyResetToken(token: string): Promise<string | null> {
    const result = await db
        .select()
        .from(verificationTokens)
        .where(
            and(
                eq(verificationTokens.token, token),
                gt(verificationTokens.expires, new Date()),
            ),
        )
        .limit(1)

    if (result.length === 0) {
        return null
    }

    const identifier = result[0]!.identifier
    if (!identifier.startsWith("password-reset:")) {
        return null
    }

    // Extract email from identifier
    return identifier.replace("password-reset:", "")
}

export async function deleteResetToken(token: string): Promise<void> {
    await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token))
}
