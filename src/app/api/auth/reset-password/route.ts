import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { hashPassword, passwordSchema } from '~/lib/auth/password'
import { verifyResetToken, deleteResetToken } from '~/lib/auth/reset-token'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'

const resetPasswordSchema = z.object({
    token: z.string(),
    password: passwordSchema,
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = resetPasswordSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                {
                    error:
                        validation.error.errors[0]?.message ??
                        'Validation failed',
                },
                { status: 400 },
            )
        }

        const { token, password } = validation.data

        // Verify token
        const email = await verifyResetToken(token)

        if (!email) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 },
            )
        }

        // Get user
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        if (existingUser.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 },
            )
        }

        // Hash new password
        const hashedPassword = await hashPassword(password)

        // Update user password
        await db
            .update(users)
            .set({ hashedPassword })
            .where(eq(users.email, email))

        // Delete the reset token
        await deleteResetToken(token)

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully',
        })
    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'An error occurred while resetting your password' },
            { status: 500 },
        )
    }
}
