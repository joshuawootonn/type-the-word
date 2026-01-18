'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

type Submission = {
    id: string
    studentGoogleId: string
    versesCompleted: number
    totalVerses: number
    averageWpm: number | null
    averageAccuracy: number | null
    completedAt: string | null
    grade: number | null
    gradeSubmittedAt: string | null
}

type Assignment = {
    id: string
    title: string
    book: string
    chapter: number
    firstVerse: number | null
    lastVerse: number | null
    translation: string
    submissions: Submission[]
}

type TeacherResponse = {
    assignment?: Assignment
    error?: string
}

/**
 * Teacher View (iframe)
 * This page shows teachers the progress of students on a Type the Word assignment.
 *
 * Query parameters from Classroom:
 * - courseId: The course ID
 * - itemId: The coursework item ID
 * - attachmentId: Our attachment identifier
 * - login_hint: Teacher's email
 */
export default function TeacherViewPage() {
    const searchParams = useSearchParams()

    const attachmentId = searchParams?.get('attachmentId')
    const courseId = searchParams?.get('courseId')

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!attachmentId) {
            setError('No attachment ID provided')
            setIsLoading(false)
            return
        }

        fetch(`/api/classroom/addon/attachment?attachmentId=${attachmentId}`)
            .then(response => response.json() as Promise<TeacherResponse>)
            .then(data => {
                if (data.assignment) {
                    setAssignment(data.assignment)
                } else {
                    setError(data.error ?? 'Assignment not found')
                }
            })
            .catch(() => {
                setError('Failed to load assignment')
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [attachmentId])

    if (isLoading) {
        return (
            <div className="p-4">
                <p className="text-gray-600">Loading student progress...</p>
            </div>
        )
    }

    if (error ?? !assignment) {
        return (
            <div className="p-4">
                <p className="text-red-600">
                    {error ?? 'Assignment not found'}
                </p>
            </div>
        )
    }

    const completedCount = assignment.submissions.filter(
        s => s.completedAt,
    ).length
    const totalStudents = assignment.submissions.length

    return (
        <div className="p-4">
            <h1 className="mb-2 text-xl font-bold text-primary">
                {assignment.title}
            </h1>
            <p className="mb-4 text-sm text-gray-600">
                {assignment.book.charAt(0).toUpperCase() +
                    assignment.book.slice(1).replace(/_/g, ' ')}{' '}
                {assignment.chapter}
                {assignment.firstVerse
                    ? assignment.lastVerse
                        ? `:${assignment.firstVerse}-${assignment.lastVerse}`
                        : `:${assignment.firstVerse}`
                    : ''}{' '}
                ({assignment.translation.toUpperCase()})
            </p>

            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded border border-gray-200 p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                        {completedCount}/{totalStudents}
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="rounded border border-gray-200 p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                        {assignment.submissions.length > 0
                            ? Math.round(
                                  assignment.submissions.reduce(
                                      (sum, s) => sum + (s.averageWpm ?? 0),
                                      0,
                                  ) /
                                      assignment.submissions.filter(
                                          s => s.averageWpm,
                                      ).length,
                              ) || '-'
                            : '-'}
                    </div>
                    <div className="text-xs text-gray-600">Avg WPM</div>
                </div>
                <div className="rounded border border-gray-200 p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                        {assignment.submissions.length > 0
                            ? Math.round(
                                  assignment.submissions.reduce(
                                      (sum, s) =>
                                          sum + (s.averageAccuracy ?? 0),
                                      0,
                                  ) /
                                      assignment.submissions.filter(
                                          s => s.averageAccuracy,
                                      ).length,
                              ) || '-'
                            : '-'}
                        %
                    </div>
                    <div className="text-xs text-gray-600">Avg Accuracy</div>
                </div>
            </div>

            {/* Student Table */}
            {assignment.submissions.length === 0 ? (
                <p className="text-center text-gray-500">
                    No student submissions yet.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="pb-2 text-left font-medium text-gray-600">
                                    Student
                                </th>
                                <th className="pb-2 text-center font-medium text-gray-600">
                                    Progress
                                </th>
                                <th className="pb-2 text-center font-medium text-gray-600">
                                    WPM
                                </th>
                                <th className="pb-2 text-center font-medium text-gray-600">
                                    Accuracy
                                </th>
                                <th className="pb-2 text-center font-medium text-gray-600">
                                    Grade
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignment.submissions.map(submission => (
                                <tr
                                    key={submission.id}
                                    className="border-b border-gray-100"
                                >
                                    <td className="py-2">
                                        {submission.studentGoogleId}
                                    </td>
                                    <td className="py-2 text-center">
                                        <div className="mx-auto w-24">
                                            <div className="h-2 rounded-full bg-gray-200">
                                                <div
                                                    className="h-2 rounded-full bg-primary"
                                                    style={{
                                                        width: `${(submission.versesCompleted / submission.totalVerses) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {submission.versesCompleted}/
                                                {submission.totalVerses}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2 text-center">
                                        {submission.averageWpm ?? '-'}
                                    </td>
                                    <td className="py-2 text-center">
                                        {submission.averageAccuracy
                                            ? `${submission.averageAccuracy}%`
                                            : '-'}
                                    </td>
                                    <td className="py-2 text-center">
                                        {submission.grade ?? '-'}
                                        {submission.gradeSubmittedAt && (
                                            <span
                                                className="ml-1 text-green-600"
                                                title="Submitted to Classroom"
                                            >
                                                ✓
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
                Course ID: {courseId} | Attachment ID: {attachmentId}
            </p>
        </div>
    )
}
