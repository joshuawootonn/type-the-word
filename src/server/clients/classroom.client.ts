import type { CreateCourseWorkInput } from "~/server/clients/classroom/types"

import {
    createClassroomClient,
    createOAuth2Client,
} from "~/server/clients/classroom/google"
import { getClassroomClient } from "~/server/clients/classroom/resolver"

export type {
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
} from "~/server/clients/classroom/types"

export { createClassroomClient, createOAuth2Client }

export function getAuthUrl(state?: string): string {
    return getClassroomClient().getAuthUrl(state)
}

export function getStudentAuthUrl(state?: string): string {
    return getClassroomClient().getStudentAuthUrl(state)
}

export async function exchangeCodeForTokens(
    code: string,
    redirectUri?: string,
) {
    return getClassroomClient().exchangeCodeForTokens(code, redirectUri)
}

export async function refreshAccessToken(refreshToken: string) {
    return getClassroomClient().refreshAccessToken(refreshToken)
}

export async function listCourses(accessToken: string) {
    return getClassroomClient().listCourses(accessToken)
}

export async function listStudentCourses(accessToken: string) {
    return getClassroomClient().listStudentCourses(accessToken)
}

export async function listStudents(accessToken: string, courseId: string) {
    return getClassroomClient().listStudents(accessToken, courseId)
}

export async function getStudent(
    accessToken: string,
    courseId: string,
    userId: string,
) {
    return getClassroomClient().getStudent(accessToken, courseId, userId)
}

export async function createCourseWork(
    accessToken: string,
    courseId: string,
    data: CreateCourseWorkInput,
) {
    return getClassroomClient().createCourseWork(accessToken, courseId, data)
}

export async function getStudentSubmission(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    studentUserId: string,
) {
    return getClassroomClient().getStudentSubmission(
        accessToken,
        courseId,
        courseWorkId,
        studentUserId,
    )
}

export async function updateDraftGrade(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    draftGrade: number,
) {
    return getClassroomClient().updateDraftGrade(
        accessToken,
        courseId,
        courseWorkId,
        submissionId,
        draftGrade,
    )
}

export async function turnInSubmission(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
) {
    return getClassroomClient().turnInSubmission(
        accessToken,
        courseId,
        courseWorkId,
        submissionId,
    )
}

export async function addSubmissionLinkAttachment(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    submissionId: string,
    link: { url: string },
) {
    return getClassroomClient().addSubmissionLinkAttachment(
        accessToken,
        courseId,
        courseWorkId,
        submissionId,
        link,
    )
}

export async function updateCourseWorkState(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
    state: "DRAFT" | "PUBLISHED" | "DELETED",
) {
    return getClassroomClient().updateCourseWorkState(
        accessToken,
        courseId,
        courseWorkId,
        state,
    )
}

export async function getCourseWork(
    accessToken: string,
    courseId: string,
    courseWorkId: string,
) {
    return getClassroomClient().getCourseWork(
        accessToken,
        courseId,
        courseWorkId,
    )
}
