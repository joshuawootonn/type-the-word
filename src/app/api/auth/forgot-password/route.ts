import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { sendPasswordResetEmail } from '~/lib/auth/mailpace'
import { createResetToken } from '~/lib/auth/reset-token'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = forgotPasswordSchema.safeParse(body)

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

        const { email } = validation.data

        // Check if user exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        // Don't reveal if user exists or not for security
        if (existingUser.length === 0) {
            return NextResponse.json({
                success: true,
                message:
                    'If an account exists with that email, a password reset link has been sent.',
            })
        }

        const user = existingUser[0]

        // Only allow password reset for users with credentials (not OAuth-only users)
        if (!user?.hashedPassword) {
            return NextResponse.json({
                success: true,
                message:
                    'If an account exists with that email, a password reset link has been sent.',
            })
        }

        // Generate reset token
        const resetToken = await createResetToken(email)

        // Send email
        await sendPasswordResetEmail(email, resetToken)

        return NextResponse.json({
            success: true,
            message:
                'If an account exists with that email, a password reset link has been sent.',
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'An error occurred while processing your request' },
            { status: 500 },
        )
    }
}
