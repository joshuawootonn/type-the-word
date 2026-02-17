import { z } from "zod"

export const SCOPES = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.students",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
]

export const STUDENT_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me",
]

export const tokenResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.date(),
    scope: z.string(),
})

export const refreshTokenResponseSchema = z.object({
    accessToken: z.string(),
    expiresAt: z.date(),
})

export const courseSchema = z.object({
    id: z.string(),
    name: z.string(),
    section: z.string().optional(),
    descriptionHeading: z.string().optional(),
    room: z.string().optional(),
    courseState: z.string().optional(),
})

export const studentProfileSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    emailAddress: z.string().optional(),
    photoUrl: z.string().optional(),
})

export const studentSchema = z.object({
    courseId: z.string(),
    userId: z.string(),
    profile: studentProfileSchema.optional(),
})

export const courseWorkSchema = z.object({
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

export const submissionSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    courseWorkId: z.string(),
    userId: z.string(),
    state: z.string().optional(),
    assignedGrade: z.number().optional(),
    draftGrade: z.number().optional(),
})

export const draftGradeResponseSchema = z.object({
    id: z.string(),
    draftGrade: z.number().optional(),
})

export const turnInResponseSchema = z.object({
    success: z.literal(true),
})

export const modifyAttachmentsResponseSchema = z.object({
    id: z.string(),
})

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

export type CourseWorkState = "DRAFT" | "PUBLISHED" | "DELETED"

export type CreateCourseWorkInput = {
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
}

export type ClassroomClient = {
    getAuthUrl: (state?: string) => string
    getStudentAuthUrl: (state?: string) => string
    exchangeCodeForTokens: (
        code: string,
        redirectUri?: string,
    ) => Promise<TokenResponse>
    refreshAccessToken: (refreshToken: string) => Promise<RefreshTokenResponse>
    listCourses: (accessToken: string) => Promise<Course[]>
    listStudentCourses: (accessToken: string) => Promise<Course[]>
    listStudents: (accessToken: string, courseId: string) => Promise<Student[]>
    getStudent: (
        accessToken: string,
        courseId: string,
        userId: string,
    ) => Promise<Student | null>
    createCourseWork: (
        accessToken: string,
        courseId: string,
        data: CreateCourseWorkInput,
    ) => Promise<CourseWork>
    getStudentSubmission: (
        accessToken: string,
        courseId: string,
        courseWorkId: string,
        studentUserId: string,
    ) => Promise<Submission | null>
    updateDraftGrade: (
        accessToken: string,
        courseId: string,
        courseWorkId: string,
        submissionId: string,
        draftGrade: number,
    ) => Promise<DraftGradeResponse>
    turnInSubmission: (
        accessToken: string,
        courseId: string,
        courseWorkId: string,
        submissionId: string,
    ) => Promise<TurnInResponse>
    addSubmissionLinkAttachment: (
        accessToken: string,
        courseId: string,
        courseWorkId: string,
        submissionId: string,
        link: { url: string },
    ) => Promise<ModifyAttachmentsResponse>
    updateCourseWorkState: (
        accessToken: string,
        courseId: string,
        courseWorkId: string,
        state: CourseWorkState,
    ) => Promise<CourseWork>
    getCourseWork: (
        accessToken: string,
        courseId: string,
        courseWorkId: string,
    ) => Promise<CourseWork>
}
