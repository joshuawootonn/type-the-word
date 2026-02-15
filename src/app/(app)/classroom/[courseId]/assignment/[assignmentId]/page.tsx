import { getServerSession } from "next-auth"

import { getAssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { getOrCreateTypingSession } from "~/app/api/typing-session/getOrCreateTypingSession"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Link } from "~/components/ui/link"
import { fetchPassage } from "~/lib/api"
import { passageSegmentSchema } from "~/lib/passageSegment"
import toProperCase from "~/lib/toProperCase"
import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    listCourses,
    listStudentCourses,
    refreshAccessToken,
    getStudent,
    getStudentSubmission,
} from "~/server/clients/classroom.client"
import {
    getAssignment,
    getTeacherToken,
    updateTeacherTokenAccess,
    getOrCreateSubmission,
} from "~/server/repositories/classroom.repository"

import {
    buildAssignmentChapterSegmentsFromMetadata,
    getActiveChapterIndex,
} from "./chapter-segments"
import { StudentClientPage } from "./student-client-page"
import { TeacherClientPage } from "./teacher-client-page"

interface PageProps {
    params: Promise<{ courseId: string; assignmentId: string }>
    searchParams: Promise<{ chapter?: string | string[] }>
}

function buildReferenceLabel(data: {
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
}): string {
    const base = toProperCase(data.book)
    const sameChapter = data.startChapter === data.endChapter
    const sameVerse =
        data.startChapter === data.endChapter &&
        data.startVerse === data.endVerse
    const chapterSegment = sameChapter
        ? `${data.startChapter}:${data.startVerse}${
              sameVerse ? "" : `-${data.endVerse}`
          }`
        : `${data.startChapter}:${data.startVerse}-${data.endChapter}:${data.endVerse}`

    return `${base} ${chapterSegment}`
}

function buildPassageSegment(data: {
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
}) {
    if (data.startChapter !== data.endChapter) {
        return null
    }

    const sameVerse = data.startVerse === data.endVerse
    const verseSegment = sameVerse
        ? `${data.startChapter}:${data.startVerse}`
        : `${data.startChapter}:${data.startVerse}-${data.endVerse}`

    return passageSegmentSchema.parse(`${data.book} ${verseSegment}`)
}

export default async function AssignmentDetailPage({
    params,
    searchParams,
}: PageProps) {
    const session = await getServerSession(authOptions)
    const { courseId, assignmentId } = await params
    const resolvedSearchParams = await searchParams

    if (!session?.user) {
        return (
            <div>
                <h1>Assignment</h1>
                <p>Please sign in to view this assignment.</p>
                <Link
                    href={`/auth/login?callbackUrl=%2Fclassroom%2F${encodeURIComponent(courseId)}%2Fassignment%2F${encodeURIComponent(assignmentId)}`}
                >
                    Log in
                </Link>
            </div>
        )
    }

    const assignment = await getAssignment(assignmentId)

    if (!assignment) {
        return (
            <ClassroomNotice
                title="Assignment Not Found"
                variant="error"
                message="This assignment could not be found."
                linkHref="/classroom/dashboard"
                linkLabel="Back to Dashboard"
            />
        )
    }

    // Check if user is the teacher who owns this assignment
    const teacherToken = await getTeacherToken(session.user.id).catch(
        () => null,
    )
    const isTeacher =
        teacherToken && assignment.teacherUserId === session.user.id

    if (isTeacher) {
        // Teacher view - show class stats
        let accessToken = teacherToken.accessToken
        const now = new Date()
        if (teacherToken.expiresAt <= now) {
            const refreshed = await refreshAccessToken(
                teacherToken.refreshToken,
            )
            accessToken = refreshed.accessToken
            await updateTeacherTokenAccess(
                session.user.id,
                refreshed.accessToken,
                refreshed.expiresAt,
            )
        }

        // Fetch course info
        const courses = await listCourses(accessToken)
        const course = courses.find(c => c.id === courseId)

        return (
            <TeacherClientPage
                assignmentId={assignmentId}
                courseId={courseId}
                courseName={course?.name || "Unknown Course"}
            />
        )
    }

    // Student view - complete the assignment
    const referenceLabel = buildReferenceLabel({
        book: assignment.book,
        startChapter: assignment.startChapter,
        startVerse: assignment.startVerse,
        endChapter: assignment.endChapter,
        endVerse: assignment.endVerse,
    })
    const passageSegment = buildPassageSegment({
        book: assignment.book,
        startChapter: assignment.startChapter,
        startVerse: assignment.startVerse,
        endChapter: assignment.endChapter,
        endVerse: assignment.endVerse,
    })
    const chapterSegments =
        passageSegment != null
            ? [
                  {
                      chapter: assignment.startChapter,
                      startVerse: assignment.startVerse,
                      endVerse: assignment.endVerse,
                      passageSegment,
                      referenceLabel,
                  },
              ]
            : await buildAssignmentChapterSegmentsFromMetadata({
                  book: assignment.book,
                  startChapter: assignment.startChapter,
                  startVerse: assignment.startVerse,
                  endChapter: assignment.endChapter,
                  endVerse: assignment.endVerse,
                  translation: assignment.translation,
              })

    if (chapterSegments.length === 0) {
        return (
            <ClassroomNotice
                title={assignment.title}
                variant="error"
                message="This assignment has an invalid chapter range."
            />
        )
    }

    const chapterParam = Array.isArray(resolvedSearchParams.chapter)
        ? resolvedSearchParams.chapter[0]
        : resolvedSearchParams.chapter
    const normalizedActiveChapterIndex = getActiveChapterIndex(
        chapterSegments,
        chapterParam,
    )
    const activeChapterSegment = chapterSegments[normalizedActiveChapterIndex]

    if (!activeChapterSegment) {
        return (
            <ClassroomNotice
                title={assignment.title}
                variant="error"
                message="Unable to load the selected chapter."
            />
        )
    }

    // Get teacher's token to access Google Classroom API
    let teacherAccessToken: string
    try {
        const tokenRecord = await getValidTeacherToken(assignment.teacherUserId)
        teacherAccessToken = tokenRecord.accessToken
    } catch (_error) {
        return (
            <ClassroomNotice
                title={assignment.title}
                variant="error"
                message="This assignment is not connected to Google Classroom."
            />
        )
    }

    // Get student's token and verify enrollment
    let studentAccessToken: string
    let googleUserId: string
    try {
        const studentToken = await getValidStudentToken(session.user.id)
        studentAccessToken = studentToken.accessToken
        googleUserId = studentToken.googleUserId
    } catch (_error) {
        return (
            <ClassroomNotice
                title={assignment.title}
                variant="error"
                message="Please connect your student Google Classroom account before starting this assignment."
                linkHref="/classroom"
                linkLabel="Connect Student Account"
            />
        )
    }

    const student = await getStudent(
        teacherAccessToken,
        assignment.courseId,
        googleUserId,
    )

    if (!student) {
        return (
            <ClassroomNotice
                title={assignment.title}
                variant="error"
                message="Please sign in with the Google account enrolled in this Classroom."
            />
        )
    }

    const classroomSubmission = await getStudentSubmission(
        teacherAccessToken,
        assignment.courseId,
        assignment.courseWorkId,
        student.userId,
    )

    const submission = await getOrCreateSubmission({
        assignmentId: assignment.id,
        studentUserId: session.user.id,
        totalVerses: assignment.totalVerses,
        submissionId: classroomSubmission?.id,
    })

    // Fetch course info for breadcrumbs using student's token
    const courses = await listStudentCourses(studentAccessToken)
    const course = courses.find(c => c.id === courseId)

    const [passage, typingSession, assignmentHistory] = await Promise.all([
        fetchPassage(
            activeChapterSegment.passageSegment,
            assignment.translation,
        ),
        getOrCreateTypingSession(session.user.id, assignmentId),
        getAssignmentHistory(session.user.id, assignmentId),
    ])

    return (
        <StudentClientPage
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
            referenceLabel={referenceLabel}
            translation={assignment.translation}
            passage={passage}
            chapterSegments={chapterSegments}
            activeChapterIndex={normalizedActiveChapterIndex}
            totalVerses={assignment.totalVerses}
            submission={{
                id: submission.id,
                submissionId: submission.submissionId,
                isTurnedIn: submission.isTurnedIn === 1,
            }}
            typingSession={typingSession}
            assignmentHistory={assignmentHistory}
            courseId={courseId}
            courseName={course?.name || "Unknown Course"}
        />
    )
}
