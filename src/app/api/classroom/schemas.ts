import { z } from "zod"

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

// GET /api/classroom/courses
export const courseSchema = z.object({
    id: z.string(),
    name: z.string(),
    section: z.string().optional(),
    descriptionHeading: z.string().optional(),
    room: z.string().optional(),
    courseState: z.string().optional(),
})

export const coursesResponseSchema = z.object({
    courses: z.array(courseSchema),
})

export type Course = z.infer<typeof courseSchema>
export type CoursesResponse = z.infer<typeof coursesResponseSchema>

// POST /api/classroom/assignments
export const createAssignmentRequestSchema = z.object({
    courseId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    translation: z.string(),
    book: z.string(),
    startChapter: z.number().int().positive(),
    startVerse: z.number().int().positive(),
    endChapter: z.number().int().positive(),
    endVerse: z.number().int().positive(),
    maxPoints: z.number().int().positive().default(100),
    // Date inputs return "YYYY-MM-DD" format
    // Server will set time to end of day (11:59 PM)
    dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
})

export const createAssignmentResponseSchema = z.object({
    assignmentId: z.string(),
    courseWorkId: z.string(),
    courseWorkLink: z.string().optional(),
})

export type CreateAssignmentRequest = z.infer<
    typeof createAssignmentRequestSchema
>
export type CreateAssignmentResponse = z.infer<
    typeof createAssignmentResponseSchema
>
