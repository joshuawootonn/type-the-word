import { z } from 'zod'

/**
 * Shared Zod schemas for classroom API endpoints
 * Used for both client-side and server-side validation
 */

// GET /api/classroom/auth
export const authResponseSchema = z.object({
    authUrl: z.string().url(),
})

export type AuthResponse = z.infer<typeof authResponseSchema>

// GET /api/classroom/status
export const statusResponseSchema = z.object({
    connected: z.boolean(),
})

export type StatusResponse = z.infer<typeof statusResponseSchema>

// POST /api/classroom/disconnect
export const disconnectResponseSchema = z.object({
    success: z.boolean(),
})

export type DisconnectResponse = z.infer<typeof disconnectResponseSchema>

// Error response (used by all endpoints)
export const errorResponseSchema = z.object({
    error: z.string(),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
