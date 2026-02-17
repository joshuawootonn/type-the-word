import { google, classroom_v1 } from "googleapis"
import { z } from "zod"

import { env } from "~/env.mjs"

import {
    SCOPES,
    STUDENT_SCOPES,
    ClassroomClient,
    Course,
    CourseWork,
    CourseWorkState,
    CreateCourseWorkInput,
    DraftGradeResponse,
    ModifyAttachmentsResponse,
    RefreshTokenResponse,
    Student,
    Submission,
    TokenResponse,
    TurnInResponse,
    courseSchema,
    courseWorkSchema,
    draftGradeResponseSchema,
    modifyAttachmentsResponseSchema,
    refreshTokenResponseSchema,
    studentSchema,
    submissionSchema,
    tokenResponseSchema,
    turnInResponseSchema,
} from "./types"

export function createOAuth2Client(redirectUri?: string) {
    return new google.auth.OAuth2(
        env.GOOGLE_CLASSROOM_CLIENT_ID,
        env.GOOGLE_CLASSROOM_CLIENT_SECRET,
        redirectUri ?? `${env.DEPLOYED_URL}/api/classroom/callback`,
    )
}

export function createClassroomClient(accessToken: string) {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
        access_token: accessToken,
    })

    return google.classroom({ version: "v1", auth: oauth2Client })
}

async function exchangeCodeForTokens(
    code: string,
    redirectUri?: string,
): Promise<TokenResponse> {
    const oauth2Client = createOAuth2Client(redirectUri)
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error("Failed to get tokens from Google")
    }

    return tokenResponseSchema.parse({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
        scope: tokens.scope ?? SCOPES.join(" "),
    })
}

async function refreshAccessToken(
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

    return refreshTokenResponseSchema.parse({
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
    })
}

async function listCourses(accessToken: string): Promise<Course[]> {
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

async function listStudentCourses(accessToken: string): Promise<Course[]> {
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

async function listStudents(
    accessToken: string,
    courseId: string,
): Promise<Student[]> {
    const classroom = createClassroomClient(accessToken)
    const response = await classroom.courses.students.list({ courseId })

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

async function getStudent(
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

        return studentSchema.parse({
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
        })
    } catch (_error) {
        return null
    }
}

async function createCourseWork(
    accessToken: string,
    courseId: string,
    data: CreateCourseWorkInput,
): Promise<CourseWork> {
    const classroom = createClassroomClient(accessToken)
    const response = await classroom.courses.courseWork.create({
        courseId,
        requestBody: data,
    })

    return courseWorkSchema.parse({
        id: response.data.id!,
        courseId: response.data.courseId!,
        title: response.data.title!,
        description: response.data.description,
        state: response.data.state,
        alternateLink: response.data.alternateLink,
        maxPoints: response.data.maxPoints,
        dueDate: response.data.dueDate,
        dueTime: response.data.dueTime,
    })
}

async function getStudentSubmission(
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

    return submissionSchema.parse({
        id: submission.id!,
        courseId: submission.courseId!,
        courseWorkId: submission.courseWorkId!,
        userId: submission.userId!,
        state: submission.state,
        assignedGrade: submission.assignedGrade,
        draftGrade: submission.draftGrade,
    })
}

async function updateDraftGrade(
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
            requestBody: { draftGrade },
        })

    return draftGradeResponseSchema.parse({
        id: response.data.id!,
        draftGrade: response.data.draftGrade,
    })
}

async function turnInSubmission(
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

    return turnInResponseSchema.parse({ success: true })
}

async function addSubmissionLinkAttachment(
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

    return modifyAttachmentsResponseSchema.parse({
        id: response.data.id!,
    })
}

async function updateCourseWorkState(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    state: CourseWorkState,
): Promise<CourseWork> {
    const classroom = createClassroomClient(accessToken)
    const response = await classroom.courses.courseWork.patch({
        courseId,
        id: courseWorkId,
        updateMask: "state",
        requestBody: { state },
    })

    return courseWorkSchema.parse({
        id: response.data.id!,
        courseId: response.data.courseId!,
        title: response.data.title!,
        description: response.data.description,
        state: response.data.state,
        alternateLink: response.data.alternateLink,
        maxPoints: response.data.maxPoints,
        dueDate: response.data.dueDate,
        dueTime: response.data.dueTime,
    })
}

async function getCourseWork(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
): Promise<CourseWork> {
    const classroom = createClassroomClient(accessToken)
    const response = await classroom.courses.courseWork.get({
        courseId,
        id: courseWorkId,
    })

    return courseWorkSchema.parse({
        id: response.data.id!,
        courseId: response.data.courseId!,
        title: response.data.title!,
        description: response.data.description,
        state: response.data.state,
        alternateLink: response.data.alternateLink,
        maxPoints: response.data.maxPoints,
        dueDate: response.data.dueDate,
        dueTime: response.data.dueTime,
    })
}

function getAuthUrl(state?: string): string {
    const oauth2Client = createOAuth2Client(
        `${env.DEPLOYED_URL}/api/classroom/callback`,
    )

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
        state,
    })
}

function getStudentAuthUrl(state?: string): string {
    const oauth2Client = createOAuth2Client(
        `${env.DEPLOYED_URL}/api/classroom/student-callback`,
    )

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: STUDENT_SCOPES,
        prompt: "consent",
        state,
    })
}

export function createGoogleClassroomClient(): ClassroomClient {
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
