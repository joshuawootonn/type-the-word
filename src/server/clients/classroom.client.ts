import { google, classroom_v1 } from "googleapis"
import { z } from "zod"

import { env } from "~/env.mjs"

// OAuth 2.0 scopes needed for Google Classroom
const SCOPES = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.students",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
]

const STUDENT_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me",
]

// Zod schemas for return types

const tokenResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.date(),
    scope: z.string(),
})

const refreshTokenResponseSchema = z.object({
    accessToken: z.string(),
    expiresAt: z.date(),
})

const courseSchema = z.object({
    id: z.string(),
    name: z.string(),
    section: z.string().optional(),
    descriptionHeading: z.string().optional(),
    room: z.string().optional(),
    courseState: z.string().optional(),
})

const studentProfileSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    emailAddress: z.string().optional(),
    photoUrl: z.string().optional(),
})

const studentSchema = z.object({
    courseId: z.string(),
    userId: z.string(),
    profile: studentProfileSchema.optional(),
})

const courseWorkSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    state: z.string().optional(),
    alternateLink: z.string().optional(),
    maxPoints: z.number().optional(),
    dueDate: z
        .object({ year: z.number(), month: z.number(), day: z.number() })
        .optional(),
    dueTime: z.object({ hours: z.number(), minutes: z.number() }).optional(),
})

const submissionSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    courseWorkId: z.string(),
    userId: z.string(),
    state: z.string().optional(),
    assignedGrade: z.number().optional(),
    draftGrade: z.number().optional(),
})

const draftGradeResponseSchema = z.object({
    id: z.string(),
    draftGrade: z.number().optional(),
})

const turnInResponseSchema = z.object({
    success: z.literal(true),
})

const modifyAttachmentsResponseSchema = z.object({
    id: z.string(),
})

// Export types inferred from schemas
export type TokenResponse = z.infer<typeof tokenResponseSchema>
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>
export type Course = z.infer<typeof courseSchema>
export type Student = z.infer<typeof studentSchema>
export type CourseWork = z.infer<typeof courseWorkSchema>
export type Submission = z.infer<typeof submissionSchema>
export type DraftGradeResponse = z.infer<typeof draftGradeResponseSchema>
export type TurnInResponse = z.infer<typeof turnInResponseSchema>
export type ModifyAttachmentsResponse = z.infer<
    typeof modifyAttachmentsResponseSchema
>

/**
 * Creates an OAuth2 client for Google Classroom API
 */
export function createOAuth2Client(redirectUri?: string) {
    return new google.auth.OAuth2(
        env.GOOGLE_CLASSROOM_CLIENT_ID,
        env.GOOGLE_CLASSROOM_CLIENT_SECRET,
        redirectUri ?? `${env.DEPLOYED_URL}/api/classroom/callback`,
    )
}

/**
 * Generates the Google OAuth URL for teacher to authorize
 */
export function getAuthUrl(state?: string): string {
    const oauth2Client = createOAuth2Client(
        `${env.DEPLOYED_URL}/api/classroom/callback`,
    )

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent", // Force consent screen to get refresh token
        state: state,
    })
}

/**
 * Generates the Google OAuth URL for student to authorize
 */
export function getStudentAuthUrl(state?: string): string {
    const oauth2Client = createOAuth2Client(
        `${env.DEPLOYED_URL}/api/classroom/student-callback`,
    )

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: STUDENT_SCOPES,
        prompt: "consent",
        state: state,
    })
}

/**
 * Exchanges authorization code for tokens
 */
export async function exchangeCodeForTokens(
    code: string,
    redirectUri?: string,
): Promise<TokenResponse> {
    const oauth2Client = createOAuth2Client(redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to get tokens from Google")
    }

    const result = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000), // Default 1 hour
        scope: tokens.scope ?? SCOPES.join(" "),
    }

    return tokenResponseSchema.parse(result)
}

/**
 * Refreshes an expired access token using refresh token
 */
export async function refreshAccessToken(
    refreshToken: string,
): Promise<RefreshTokenResponse> {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
        throw new Error("Failed to refresh access token")
    }

    const result = {
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
    }

    return refreshTokenResponseSchema.parse(result)
}

/**
 * Creates an authenticated Classroom API client
 */
export function createClassroomClient(accessToken: string) {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
        access_token: accessToken,
    })

    return google.classroom({ version: "v1", auth: oauth2Client })
}

/**
 * Lists all courses for the authenticated teacher
 */
export async function listCourses(accessToken: string): Promise<Course[]> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.list({
        teacherId: "me",
        courseStates: ["ACTIVE"],
    })

    const courses =
        response.data.courses?.map((course: classroom_v1.Schema$Course) => ({
            id: course.id!,
            name: course.name!,
            section: course.section,
            descriptionHeading: course.descriptionHeading,
            room: course.room,
            courseState: course.courseState,
        })) ?? []

    return z.array(courseSchema).parse(courses)
}

/**
 * Lists all courses for the authenticated student
 */
export async function listStudentCourses(
    accessToken: string,
): Promise<Course[]> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.list({
        studentId: "me",
        courseStates: ["ACTIVE"],
    })

    const courses =
        response.data.courses?.map((course: classroom_v1.Schema$Course) => ({
            id: course.id!,
            name: course.name!,
            section: course.section,
            descriptionHeading: course.descriptionHeading,
            room: course.room,
            courseState: course.courseState,
        })) ?? []

    return z.array(courseSchema).parse(courses)
}

/**
 * Lists students enrolled in a course
 */
export async function listStudents(
    accessToken: string,
    courseId: string,
): Promise<Student[]> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.students.list({
        courseId,
    })

    const students =
        response.data.students?.map((student: classroom_v1.Schema$Student) => ({
            courseId: student.courseId!,
            userId: student.userId!,
            profile: student.profile
                ? {
                      id: student.profile.id!,
                      name: student.profile.name?.fullName,
                      emailAddress: student.profile.emailAddress,
                      photoUrl: student.profile.photoUrl,
                  }
                : undefined,
        })) ?? []

    return z.array(studentSchema).parse(students)
}

/**
 * Gets a specific student by Google user ID
 */
export async function getStudent(
    accessToken: string,
    courseId: string,
    userId: string,
): Promise<Student | null> {
    const classroom = createClassroomClient(accessToken)

    try {
        const response = await classroom.courses.students.get({
            courseId,
            userId,
        })

        const student = response.data
        if (!student) {
            return null
        }

        const result = {
            courseId: student.courseId!,
            userId: student.userId!,
            profile: student.profile
                ? {
                      id: student.profile.id!,
                      name: student.profile.name?.fullName,
                      emailAddress: student.profile.emailAddress,
                      photoUrl: student.profile.photoUrl,
                  }
                : undefined,
        }

        return studentSchema.parse(result)
    } catch (_error) {
        return null
    }
}

/**
 * Creates a CourseWork (assignment) in Google Classroom
 */
export async function createCourseWork(
    accessToken: string,
    courseId: string,
    data: {
        title: string
        description?: string
        workType: "ASSIGNMENT"
        state?: "DRAFT" | "PUBLISHED"
        maxPoints: number
        dueDate?: { year: number; month: number; day: number }
        dueTime?: { hours: number; minutes: number }
        materials?: Array<{
            link: { url: string; title?: string }
        }>
    },
): Promise<CourseWork> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.courseWork.create({
        courseId,
        requestBody: data,
    })

    const result = {
        id: response.data.id!,
        courseId: response.data.courseId!,
        title: response.data.title!,
        description: response.data.description,
        state: response.data.state,
        alternateLink: response.data.alternateLink,
        maxPoints: response.data.maxPoints,
        dueDate: response.data.dueDate,
        dueTime: response.data.dueTime,
    }

    return courseWorkSchema.parse(result)
}

/**
 * Gets a student's submission for a CourseWork
 */
export async function getStudentSubmission(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    studentUserId: string,
): Promise<Submission | null> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.courseWork.studentSubmissions.list(
        {
            courseId,
            courseWorkId,
            userId: studentUserId,
        },
    )

    const submission = response.data.studentSubmissions?.[0]
    if (!submission) {
        return null
    }

    const result = {
        id: submission.id!,
        courseId: submission.courseId!,
        courseWorkId: submission.courseWorkId!,
        userId: submission.userId!,
        state: submission.state,
        assignedGrade: submission.assignedGrade,
        draftGrade: submission.draftGrade,
    }

    return submissionSchema.parse(result)
}

/**
 * Updates a student's draft grade for a submission
 */
export async function updateDraftGrade(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    draftGrade: number,
): Promise<DraftGradeResponse> {
    const classroom = createClassroomClient(accessToken)

    const response =
        await classroom.courses.courseWork.studentSubmissions.patch({
            courseId,
            courseWorkId,
            id: submissionId,
            updateMask: "draftGrade",
            requestBody: {
                draftGrade,
            },
        })

    const result = {
        id: response.data.id!,
        draftGrade: response.data.draftGrade,
    }

    return draftGradeResponseSchema.parse(result)
}

/**
 * Turns in a student submission (returns it)
 */
export async function turnInSubmission(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
): Promise<TurnInResponse> {
    const classroom = createClassroomClient(accessToken)

    await classroom.courses.courseWork.studentSubmissions.turnIn({
        courseId,
        courseWorkId,
        id: submissionId,
    })

    // Return success - the API returns empty on success
    const result = { success: true as const }
    return turnInResponseSchema.parse(result)
}

/**
 * Adds a link attachment to a student submission
 */
export async function addSubmissionLinkAttachment(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    link: { url: string },
): Promise<ModifyAttachmentsResponse> {
    const classroom = createClassroomClient(accessToken)

    const response =
        await classroom.courses.courseWork.studentSubmissions.modifyAttachments(
            {
                courseId,
                courseWorkId,
                id: submissionId,
                requestBody: {
                    addAttachments: [
                        {
                            link: { url: link.url },
                        },
                    ],
                },
            },
        )

    const result = {
        id: response.data.id!,
    }

    return modifyAttachmentsResponseSchema.parse(result)
}

/**
 * Updates the state of a CourseWork (e.g., from DRAFT to PUBLISHED)
 */
export async function updateCourseWorkState(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    state: "DRAFT" | "PUBLISHED" | "DELETED",
): Promise<CourseWork> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.courseWork.patch({
        courseId,
        id: courseWorkId,
        updateMask: "state",
        requestBody: {
            state,
        },
    })

    const result = {
        id: response.data.id!,
        courseId: response.data.courseId!,
        title: response.data.title!,
        description: response.data.description,
        state: response.data.state,
        alternateLink: response.data.alternateLink,
        maxPoints: response.data.maxPoints,
        dueDate: response.data.dueDate,
        dueTime: response.data.dueTime,
    }

    return courseWorkSchema.parse(result)
}

/**
 * Gets a CourseWork from Google Classroom
 */
export async function getCourseWork(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
): Promise<CourseWork> {
    const classroom = createClassroomClient(accessToken)

    const response = await classroom.courses.courseWork.get({
        courseId,
        id: courseWorkId,
    })

    const result = {
        id: response.data.id!,
        courseId: response.data.courseId!,
        title: response.data.title!,
        description: response.data.description,
        state: response.data.state,
        alternateLink: response.data.alternateLink,
        maxPoints: response.data.maxPoints,
        dueDate: response.data.dueDate,
        dueTime: response.data.dueTime,
    }

    return courseWorkSchema.parse(result)
}
