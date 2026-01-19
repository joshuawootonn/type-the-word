import { getServerSession } from "next-auth"
import Link from "next/link"

import { getAssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { getOrCreateTypingSession } from "~/app/api/typing-session/getOrCreateTypingSession"
import { fetchPassage } from "~/lib/api"
import { passageSegmentSchema } from "~/lib/passageSegment"
import toProperCase from "~/lib/toProperCase"
import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    getStudent,
    getStudentSubmission,
} from "~/server/clients/classroom.client"
import {
    getAssignment,
    getOrCreateSubmission,
} from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

interface PageProps {
    params: Promise<{ assignmentId: string }>
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

export default async function ClassroomAssignmentPage({ params }: PageProps) {
    const session = await getServerSession(authOptions)
    const { assignmentId } = await params

    if (!session?.user) {
        return (
            <div>
                <h1>Assignment</h1>
                <p>Please sign in to start this assignment.</p>
                <Link
                    href={`/auth/login?callbackUrl=%2Fclassroom%2Fassignment%2F${encodeURIComponent(assignmentId)}`}
                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold no-underline"
                >
                    Log in
                </Link>
            </div>
        )
    }

    const assignment = await getAssignment(assignmentId)

    if (!assignment) {
        return (
            <div>
                <h1>Assignment Not Found</h1>
                <p>This assignment could not be found.</p>
                <Link
                    href="/"
                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold no-underline"
                >
                    Back Home
                </Link>
            </div>
        )
    }

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

    if (!passageSegment) {
        return (
            <div>
                <h1>{assignment.title}</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        This assignment spans multiple chapters, which is not
                        supported yet.
                    </p>
                </div>
            </div>
        )
    }

    let accessToken: string
    try {
        const tokenRecord = await getValidTeacherToken(assignment.teacherUserId)
        accessToken = tokenRecord.accessToken
    } catch (_error) {
        return (
            <div>
                <h1>{assignment.title}</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        This assignment is not connected to Google Classroom.
                    </p>
                </div>
            </div>
        )
    }

    let googleUserId: string
    try {
        const studentToken = await getValidStudentToken(session.user.id)
        googleUserId = studentToken.googleUserId
    } catch (_error) {
        return (
            <div>
                <h1>{assignment.title}</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        Please connect your student Google Classroom account
                        before starting this assignment.
                    </p>
                    <Link
                        href="/classroom"
                        className="svg-outline relative mt-4 inline-block border-2 border-primary px-3 py-1 font-semibold no-underline"
                    >
                        Connect Student Account
                    </Link>
                </div>
            </div>
        )
    }

    const student = await getStudent(
        accessToken,
        assignment.courseId,
        googleUserId,
    )

    if (!student) {
        return (
            <div>
                <h1>{assignment.title}</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        Please sign in with the Google account enrolled in this
                        Classroom.
                    </p>
                </div>
            </div>
        )
    }

    const classroomSubmission = await getStudentSubmission(
        accessToken,
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

    const [passage, typingSession, assignmentHistory] = await Promise.all([
        fetchPassage(passageSegment, assignment.translation),
        session == null
            ? undefined
            : getOrCreateTypingSession(session.user.id, assignmentId),
        session == null
            ? undefined
            : getAssignmentHistory(session.user.id, assignmentId),
    ])

    return (
        <ClientPage
            assignmentId={assignment.id}
            assignmentTitle={assignment.title}
            referenceLabel={referenceLabel}
            translation={assignment.translation}
            passage={passage}
            totalVerses={assignment.totalVerses}
            submission={{
                id: submission.id,
                submissionId: submission.submissionId,
                isTurnedIn: submission.isTurnedIn === 1,
            }}
            typingSession={typingSession}
            assignmentHistory={assignmentHistory}
        />
    )
}
