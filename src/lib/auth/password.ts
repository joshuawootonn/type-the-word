import bcrypt from "bcryptjs"
import { z } from "zod"

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .refine(
        password => /[A-Z]/.test(password),
        "Password must contain at least one uppercase letter",
    )
    .refine(
        password => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
        "Password must contain at least one special character",
    )

export const firstNameSchema = z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return bcrypt.compare(password, hash)
}
