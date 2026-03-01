import { z } from "zod"

export const deactivateUserRequestSchema = z.object({
    userId: z.string().min(1),
})

export const deactivateUserResponseSchema = z.object({
    success: z.literal(true),
    userId: z.string(),
    message: z.string(),
})

export const adminErrorResponseSchema = z.object({
    error: z.string(),
})

export type DeactivateUserRequest = z.infer<typeof deactivateUserRequestSchema>
export type DeactivateUserResponse = z.infer<
    typeof deactivateUserResponseSchema
>
export type AdminErrorResponse = z.infer<typeof adminErrorResponseSchema>
