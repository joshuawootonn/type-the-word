import { type Book } from "~/server/db/schema"
import {
    getTeacherToken,
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
    const [studentToken, teacherToken] = await Promise.all([
        getStudentToken(data.userId).catch(() => null),
        getTeacherToken(data.userId).catch(() => null),
    ])

    // Users without any classroom token are not connected to Classroom.
    if (!studentToken && !teacherToken) {
        return undefined
    }

    // Assignment progress warnings only apply to student assignment work.
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
