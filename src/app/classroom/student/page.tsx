'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

type Assignment = {
    id: string
    title: string
    book: string
    chapter: number
    firstVerse: number | null
    lastVerse: number | null
    translation: string
}

type Submission = {
    versesCompleted: number
    totalVerses: number
    averageWpm: number | null
    averageAccuracy: number | null
    completedAt: string | null
}

type StudentResponse = {
    assignment?: Assignment
    submission?: Submission | null
    error?: string
}

/**
 * Student View (iframe)
 * This page shows students their assignment and provides a link to complete it.
 *
 * Query parameters from Classroom:
 * - courseId: The course ID
 * - itemId: The coursework item ID
 * - attachmentId: Our attachment identifier
 * - login_hint: Student's email
 * - submissionId: Student's submission ID (for grade passback)
 */
export default function StudentViewPage() {
    const searchParams = useSearchParams()

    const attachmentId = searchParams?.get('attachmentId')
    const loginHint = searchParams?.get('login_hint')
    const submissionId = searchParams?.get('submissionId')

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [submission, setSubmission] = useState<Submission | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!attachmentId) {
            setError('No attachment ID provided')
            setIsLoading(false)
            return
        }

        const params = new URLSearchParams({
            attachmentId,
            ...(loginHint && { loginHint }),
            ...(submissionId && { submissionId }),
        })

        fetch(`/api/classroom/addon/student?${params.toString()}`)
            .then(response => response.json() as Promise<StudentResponse>)
            .then(data => {
                if (data.assignment) {
                    setAssignment(data.assignment)
                    setSubmission(data.submission ?? null)
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
    }, [attachmentId, loginHint, submissionId])

    if (isLoading) {
        return (
            <div className="flex min-h-[200px] items-center justify-center p-4">
                <p className="text-gray-600">Loading assignment...</p>
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

    // Build the passage URL
    const passageSegment = `${assignment.book}_${assignment.chapter}`
    const verseRange = assignment.firstVerse
        ? assignment.lastVerse
            ? `:${assignment.firstVerse}-${assignment.lastVerse}`
            : `:${assignment.firstVerse}`
        : ''
    const translationParam =
        assignment.translation !== 'esv'
            ? `?translation=${assignment.translation}`
            : ''

    // Add classroom context to URL for tracking
    const classroomParams = new URLSearchParams()
    if (attachmentId) classroomParams.set('classroomAttachment', attachmentId)
    if (loginHint) classroomParams.set('classroomUser', loginHint)
    if (submissionId) classroomParams.set('classroomSubmission', submissionId)

    const fullUrl = `/passage/${passageSegment}${verseRange}${translationParam}${classroomParams.toString() ? (translationParam ? '&' : '?') + classroomParams.toString() : ''}`

    const isCompleted = submission?.completedAt !== null
    const progressPercent = submission
        ? Math.round(
              (submission.versesCompleted / submission.totalVerses) * 100,
          )
        : 0

    return (
        <div className="p-4">
            <h1 className="mb-2 text-xl font-bold text-primary">
                {assignment.title}
            </h1>
            <p className="mb-4 text-gray-600">
                Type{' '}
                {assignment.book.charAt(0).toUpperCase() +
                    assignment.book.slice(1).replace(/_/g, ' ')}{' '}
                {assignment.chapter}
                {verseRange} in the {assignment.translation.toUpperCase()}{' '}
                translation.
            </p>

            {/* Progress */}
            {submission && (
                <div className="mb-6 rounded border border-gray-200 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                        <span>Your Progress</span>
                        <span>
                            {submission.versesCompleted}/
                            {submission.totalVerses} verses
                        </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-200">
                        <div
                            className={`h-3 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {isCompleted && (
                        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {submission.averageWpm ?? '-'}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Words per minute
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {submission.averageAccuracy
                                        ? `${submission.averageAccuracy}%`
                                        : '-'}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Accuracy
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Button */}
            <Link
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded bg-primary px-4 py-3 text-center font-medium text-white no-underline hover:opacity-90"
            >
                {isCompleted
                    ? 'Review Assignment'
                    : submission && submission.versesCompleted > 0
                      ? 'Continue Typing'
                      : 'Start Typing'}
            </Link>

            <p className="mt-4 text-center text-xs text-gray-500">
                Opens in a new tab. Your progress will be saved automatically.
            </p>

            {isCompleted && (
                <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-center text-sm text-green-800">
                    ✓ Assignment completed! Your grade has been submitted.
                </div>
            )}
        </div>
    )
}
