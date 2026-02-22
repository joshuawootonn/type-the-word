import { env } from "~/env.mjs"

import {
    ClassroomClient,
    Course,
    CourseWork,
    CourseWorkState,
    CreateCourseWorkInput,
    DraftGradeResponse,
    ModifyAttachmentsResponse,
    RefreshTokenResponse,
    SCOPES,
    Student,
    Submission,
    TokenResponse,
    TurnInResponse,
    courseSchema,
    courseWorkSchema,
    draftGradeResponseSchema,
    modifyAttachmentsResponseSchema,
    refreshTokenResponseSchema,
    tokenResponseSchema,
    turnInResponseSchema,
} from "./types"

type E2EMockCourseWork = {
    id: string
    courseId: string
    title: string
    description?: string
    state?: CourseWorkState
    alternateLink?: string
    maxPoints?: number
    dueDate?: { year: number; month: number; day: number }
    dueTime?: { hours: number; minutes: number }
}

type E2EClassroomMockStore = {
    courseWorks: Map<string, E2EMockCourseWork>
}

const e2eClassroomMockStore: E2EClassroomMockStore = {
    courseWorks: new Map<string, E2EMockCourseWork>(),
}
const E2E_STUDENT_GOOGLE_USER_ID = "e2e-student-google-user"

function createMockStudent(courseId: string, userId: string): Student {
    return {
        courseId,
        userId,
        profile: {
            id: userId,
            name: "E2E Student",
            emailAddress: "student@e2e.local",
        },
    }
}

function getAuthUrl(state?: string): string {
    const callbackState = state ?? "e2e-teacher-user"
    return `${env.DEPLOYED_URL}/api/classroom/callback?code=e2e-teacher-code&state=${encodeURIComponent(callbackState)}`
}

function getStudentAuthUrl(state?: string): string {
    const callbackState = state ?? "e2e-student-user"
    return `${env.DEPLOYED_URL}/api/classroom/student-callback?code=e2e-student-code&state=${encodeURIComponent(callbackState)}`
}

async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    return tokenResponseSchema.parse({
        accessToken: `e2e-access-token-${code}`,
        refreshToken: `e2e-refresh-token-${code}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        scope: SCOPES.join(" "),
    })
}

async function refreshAccessToken(
    refreshToken: string,
): Promise<RefreshTokenResponse> {
    return refreshTokenResponseSchema.parse({
        accessToken: `e2e-refreshed-${refreshToken}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })
}

async function listCourses(_accessToken: string): Promise<Course[]> {
    return [
        courseSchema.parse({
            id: "e2e-course-1",
            name: "E2E English 101",
            section: "Period 1",
            courseState: "ACTIVE",
        }),
        courseSchema.parse({
            id: "e2e-course-2",
            name: "E2E Theology",
            section: "Period 2",
            courseState: "ACTIVE",
        }),
    ]
}

async function listStudentCourses(_accessToken: string): Promise<Course[]> {
    return [
        courseSchema.parse({
            id: "e2e-course-1",
            name: "E2E English 101",
            section: "Period 1",
            courseState: "ACTIVE",
        }),
    ]
}

async function listStudents(
    _accessToken: string,
    courseId: string,
): Promise<Student[]> {
    return [createMockStudent(courseId, E2E_STUDENT_GOOGLE_USER_ID)]
}

async function getStudent(
    _accessToken: string,
    courseId: string,
    userId: string,
): Promise<Student | null> {
    if (userId !== E2E_STUDENT_GOOGLE_USER_ID) {
        return null
    }

    return createMockStudent(courseId, userId)
}

async function createCourseWork(
    _accessToken: string,
    courseId: string,
    data: CreateCourseWorkInput,
): Promise<CourseWork> {
    const id = crypto.randomUUID()
    const mockCourseWork: E2EMockCourseWork = {
        id,
        courseId,
        title: data.title,
        description: data.description,
        state: data.state ?? "DRAFT",
        alternateLink: `${env.DEPLOYED_URL}/classroom/${courseId}/coursework/${id}`,
        maxPoints: data.maxPoints,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
    }
    e2eClassroomMockStore.courseWorks.set(id, mockCourseWork)
    return courseWorkSchema.parse(mockCourseWork)
}

async function getStudentSubmission(
    _accessToken: string,
    courseId: string,
    courseWorkId: string,
    studentUserId: string,
): Promise<Submission | null> {
    return {
        id: `e2e-submission-${courseWorkId}-${studentUserId}`,
        courseId,
        courseWorkId,
        userId: studentUserId,
        state: "CREATED",
    }
}

async function updateDraftGrade(
    _accessToken: string,
    _courseId: string,
    _courseWorkId: string,
    submissionId: string,
    draftGrade: number,
): Promise<DraftGradeResponse> {
    return draftGradeResponseSchema.parse({
        id: submissionId,
        draftGrade,
    })
}

async function turnInSubmission(
    _accessToken: string,
    _courseId: string,
    _courseWorkId: string,
    _submissionId: string,
): Promise<TurnInResponse> {
    return turnInResponseSchema.parse({ success: true })
}

async function addSubmissionLinkAttachment(
    _accessToken: string,
    _courseId: string,
    _courseWorkId: string,
    submissionId: string,
    _link: { url: string },
): Promise<ModifyAttachmentsResponse> {
    return modifyAttachmentsResponseSchema.parse({ id: submissionId })
}

async function updateCourseWorkState(
    _accessToken: string,
    _courseId: string,
    courseWorkId: string,
    state: CourseWorkState,
): Promise<CourseWork> {
    const existing = e2eClassroomMockStore.courseWorks.get(courseWorkId)
    if (!existing) {
        throw new Error("Mock CourseWork not found")
    }

    const updated: E2EMockCourseWork = {
        ...existing,
        state,
    }
    e2eClassroomMockStore.courseWorks.set(courseWorkId, updated)
    return courseWorkSchema.parse(updated)
}

async function getCourseWork(
    _accessToken: string,
    _courseId: string,
    courseWorkId: string,
): Promise<CourseWork> {
    const existing = e2eClassroomMockStore.courseWorks.get(courseWorkId)
    if (!existing) {
        throw new Error("Mock CourseWork not found")
    }

    return courseWorkSchema.parse(existing)
}

export function createE2EMockClassroomClient(): ClassroomClient {
    return {
        getAuthUrl,
        getStudentAuthUrl,
        exchangeCodeForTokens,
        refreshAccessToken,
        listCourses,
        listStudentCourses,
        listStudents,
        getStudent,
        createCourseWork,
        getStudentSubmission,
        updateDraftGrade,
        turnInSubmission,
        addSubmissionLinkAttachment,
        updateCourseWorkState,
        getCourseWork,
    }
}
