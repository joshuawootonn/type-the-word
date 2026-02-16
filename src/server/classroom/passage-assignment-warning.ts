import { type Book } from "~/server/db/schema"
import {
    getStudentCoursePassageAssignmentMatch,
    getStudentPassageAssignmentMatch,
    getStudentToken,
    type StudentPassageAssignmentMatch,
} from "~/server/repositories/classroom.repository"

import { listStudentCourses } from "../clients/classroom.client"
import { getValidStudentToken } from "./student-token"

export async function getPassageAssignmentWarningMatch(data: {
    userId: string
    book: Book
    chapter: number
}): Promise<StudentPassageAssignmentMatch | undefined> {
    const studentToken = await getStudentToken(data.userId).catch(() => null)

    // Only students with a connected student token can have classroom assignment warnings.
    if (!studentToken) {
        return undefined
    }

    const submissionMatch = await getStudentPassageAssignmentMatch({
        studentUserId: data.userId,
        book: data.book,
        chapter: data.chapter,
    })

    if (submissionMatch) {
        return submissionMatch
    }

    try {
        const token = await getValidStudentToken(data.userId)
        const courses = await listStudentCourses(token.accessToken)

        return await getStudentCoursePassageAssignmentMatch({
            studentUserId: data.userId,
            courseIds: courses.map(course => course.id),
            book: data.book,
            chapter: data.chapter,
        })
    } catch (_error) {
        return undefined
    }
}
