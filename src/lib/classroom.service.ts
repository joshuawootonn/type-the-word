import { z } from 'zod'

import { env } from '~/env.mjs'

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1'

// Scopes needed for CourseWork integration
export const CLASSROOM_SCOPES = [
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
]

// Add-on specific scopes (subset, used in iframe context)
export const CLASSROOM_ADDON_SCOPES = [
    'https://www.googleapis.com/auth/classroom.addons.teacher',
    'https://www.googleapis.com/auth/classroom.addons.student',
]

// Zod schemas for API responses
const googleTokenResponseSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    expires_in: z.number(),
    scope: z.string(),
    token_type: z.string(),
    id_token: z.string().optional(),
})

const googleUserInfoSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    picture: z.string().optional(),
})

const classroomCourseSchema = z.object({
    id: z.string(),
    name: z.string(),
    section: z.string().optional(),
    descriptionHeading: z.string().optional(),
    room: z.string().optional(),
    ownerId: z.string(),
    courseState: z.enum([
        'ACTIVE',
        'ARCHIVED',
        'PROVISIONED',
        'DECLINED',
        'SUSPENDED',
    ]),
    alternateLink: z.string(),
})

const courseWorkMaterialSchema = z.object({
    link: z
        .object({
            url: z.string(),
            title: z.string().optional(),
            thumbnailUrl: z.string().optional(),
        })
        .optional(),
})

const courseWorkSchema = z.object({
    id: z.string().optional(),
    courseId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    materials: z.array(courseWorkMaterialSchema).optional(),
    state: z.enum(['PUBLISHED', 'DRAFT', 'DELETED']).optional(),
    alternateLink: z.string().optional(),
    maxPoints: z.number().optional(),
    workType: z.enum([
        'ASSIGNMENT',
        'SHORT_ANSWER_QUESTION',
        'MULTIPLE_CHOICE_QUESTION',
    ]),
})

const studentSubmissionSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    courseWorkId: z.string(),
    userId: z.string(),
    state: z.enum([
        'NEW',
        'CREATED',
        'TURNED_IN',
        'RETURNED',
        'RECLAIMED_BY_STUDENT',
    ]),
    assignedGrade: z.number().optional(),
    draftGrade: z.number().optional(),
    alternateLink: z.string().optional(),
})

const courseStudentSchema = z.object({
    courseId: z.string(),
    userId: z.string(),
    profile: z.object({
        id: z.string(),
        name: z
            .object({
                givenName: z.string().optional(),
                familyName: z.string().optional(),
                fullName: z.string().optional(),
            })
            .optional(),
        emailAddress: z.string().optional(),
        photoUrl: z.string().optional(),
    }),
})

// Export types inferred from schemas
export type GoogleTokenResponse = z.infer<typeof googleTokenResponseSchema>
export type GoogleUserInfo = z.infer<typeof googleUserInfoSchema>
export type ClassroomCourse = z.infer<typeof classroomCourseSchema>
export type CourseWorkMaterial = z.infer<typeof courseWorkMaterialSchema>
export type CourseWork = z.infer<typeof courseWorkSchema>
export type StudentSubmission = z.infer<typeof studentSubmissionSchema>
export type CourseStudent = z.infer<typeof courseStudentSchema>

/**
 * Generate the OAuth authorization URL for teachers to connect their Google Classroom
 */
export function getClassroomAuthUrl(
    state: string,
    redirectUri?: string,
): string {
    const clientId = env.GOOGLE_CLASSROOM_CLIENT_ID
    if (!clientId) {
        throw new Error('GOOGLE_CLASSROOM_CLIENT_ID is not configured')
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri:
            redirectUri ?? `${env.DEPLOYED_URL}/api/classroom/callback`,
        response_type: 'code',
        scope: CLASSROOM_SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
    })

    return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
    code: string,
    redirectUri?: string,
): Promise<GoogleTokenResponse> {
    const clientId = env.GOOGLE_CLASSROOM_CLIENT_ID
    const clientSecret = env.GOOGLE_CLASSROOM_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error('Google Classroom OAuth credentials not configured')
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri:
                redirectUri ?? `${env.DEPLOYED_URL}/api/classroom/callback`,
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to exchange code for tokens: ${error}`)
    }

    const data: unknown = await response.json()
    return googleTokenResponseSchema.parse(data)
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
    refreshToken: string,
): Promise<GoogleTokenResponse> {
    const clientId = env.GOOGLE_CLASSROOM_CLIENT_ID
    const clientSecret = env.GOOGLE_CLASSROOM_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        throw new Error('Google Classroom OAuth credentials not configured')
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to refresh token: ${error}`)
    }

    const data: unknown = await response.json()
    return googleTokenResponseSchema.parse(data)
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(
    accessToken: string,
): Promise<GoogleUserInfo> {
    const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )

    if (!response.ok) {
        throw new Error('Failed to get user info from Google')
    }

    const data: unknown = await response.json()
    return googleUserInfoSchema.parse(data)
}

/**
 * List courses where the user is a teacher
 */
export async function listTeacherCourses(
    accessToken: string,
): Promise<ClassroomCourse[]> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses?teacherId=me&courseStates=ACTIVE`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to list courses: ${error}`)
    }

    const data: unknown = await response.json()
    const parsed = z
        .object({ courses: z.array(classroomCourseSchema).optional() })
        .parse(data)
    return parsed.courses ?? []
}

/**
 * Create a new assignment (CourseWork) in a course
 */
export async function createCourseWork(
    accessToken: string,
    courseId: string,
    courseWork: Omit<CourseWork, 'id' | 'courseId'>,
): Promise<CourseWork> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...courseWork,
                state: courseWork.state ?? 'PUBLISHED',
            }),
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to create coursework: ${error}`)
    }

    const data: unknown = await response.json()
    return courseWorkSchema.parse(data)
}

/**
 * List student submissions for a coursework item
 */
export async function listStudentSubmissions(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
): Promise<StudentSubmission[]> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to list submissions: ${error}`)
    }

    const data: unknown = await response.json()
    const parsed = z
        .object({
            studentSubmissions: z.array(studentSubmissionSchema).optional(),
        })
        .parse(data)
    return parsed.studentSubmissions ?? []
}

/**
 * Update a student's grade
 */
export async function patchStudentSubmissionGrade(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    grade: number,
): Promise<StudentSubmission> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}?updateMask=draftGrade`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                draftGrade: grade,
            }),
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to update grade: ${error}`)
    }

    const data: unknown = await response.json()
    return studentSubmissionSchema.parse(data)
}

/**
 * Return a graded submission to the student
 */
export async function returnStudentSubmission(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
): Promise<void> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:return`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to return submission: ${error}`)
    }
}

/**
 * Get a single course by ID
 */
export async function getCourse(
    accessToken: string,
    courseId: string,
): Promise<ClassroomCourse> {
    const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to get course: ${error}`)
    }

    const data: unknown = await response.json()
    return classroomCourseSchema.parse(data)
}

/**
 * List students enrolled in a course
 */
export async function listCourseStudents(
    accessToken: string,
    courseId: string,
): Promise<CourseStudent[]> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/students`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to list students: ${error}`)
    }

    const data: unknown = await response.json()
    const parsed = z
        .object({ students: z.array(courseStudentSchema).optional() })
        .parse(data)
    return parsed.students ?? []
}

/**
 * Turn in a student submission
 */
export async function turnInStudentSubmission(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
): Promise<void> {
    const response = await fetch(
        `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions/${submissionId}:turnIn`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    )

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to turn in submission: ${error}`)
    }
}
