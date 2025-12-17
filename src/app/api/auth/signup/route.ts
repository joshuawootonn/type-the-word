import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
    hashPassword,
    passwordSchema,
    firstNameSchema,
} from '~/lib/auth/password'
import { createSubscription } from '~/lib/convert-kit.service'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'

const signupSchema = z.object({
    firstName: firstNameSchema,
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = signupSchema.safeParse(body)

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

        const { firstName, email, password } = validation.data

        // Check if email already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 },
            )
        }

        // Hash password
        const hashedPassword = await hashPassword(password)

        // Create user
        const newUser = await db
            .insert(users)
            .values({
                id: crypto.randomUUID(),
                email,
                hashedPassword,
                name: firstName,
                emailVerified: null,
            })
            .returning()

        // Create newsletter subscription
        try {
            await createSubscription({ email, name: firstName })
        } catch (error) {
            console.error('Failed to create subscription:', error)
            // Don't fail the signup if subscription fails
        }

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: newUser[0]?.id,
                    name: newUser[0]?.name,
                    email: newUser[0]?.email,
                },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: 'An error occurred during signup' },
            { status: 500 },
        )
    }
}
