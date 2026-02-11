"use client"

import { useCallback, useEffect, useState } from "react"

import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import { Meter } from "~/components/ui/meter"
import toProperCase from "~/lib/toProperCase"

import { type AssignmentDetail } from "../../../../api/classroom/schemas"
import { fetchAssignmentDetail, publishAssignment } from "./actions"

interface TeacherClientPageProps {
    assignmentId: string
    courseId: string
    courseName: string
}

export function TeacherClientPage({
    assignmentId,
    courseId,
    courseName,
}: TeacherClientPageProps) {
    const [data, setData] = useState<AssignmentDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isPublishing, setIsPublishing] = useState(false)
    const [publishError, setPublishError] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            const result = await fetchAssignmentDetail(assignmentId)
            setData(result)
        } catch (_err) {
            setError("Failed to load assignment details")
        } finally {
            setIsLoading(false)
        }
    }, [assignmentId])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const handlePublish = async () => {
        setIsPublishing(true)
        setPublishError(null)

        try {
            await publishAssignment(assignmentId)
            // Reload data to get updated state
            await loadData()
        } catch (err) {
            setPublishError(
                err instanceof Error ? err.message : "Failed to publish",
            )
        } finally {
            setIsPublishing(false)
        }
    }

    if (isLoading) {
        return <Loading />
    }

    if (error || !data) {
        return (
            <ClassroomNotice
                variant="error"
                message={error || "Assignment not found"}
                linkHref={`/classroom/${courseId}`}
                linkLabel="Back to Course"
            />
        )
    }

    const { assignment, students } = data
    const passageRef = `${toProperCase(assignment.book.split("_").join(" "))} ${assignment.startChapter}:${assignment.startVerse}-${assignment.endChapter}:${assignment.endVerse}`

    return (
        <div>
            {/* Breadcrumbs */}
            <nav className="not-prose mb-6 text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <Link href={`/classroom/${courseId}`} variant="text">
                    {courseName}
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>{assignment.title}</span>
            </nav>

            <h1>{assignment.title}</h1>

            {/* Publish Error */}
            {publishError && (
                <div className="not-prose border-error bg-secondary mb-6 flex items-start gap-3 border-2 p-4">
                    <svg
                        className="text-error mt-1 h-5 w-5 shrink-0"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-error">{publishError}</p>
                </div>
            )}

            {/* Assignment Info */}
            <div className="not-prose mb-6 space-y-2">
                <div>
                    <span className="font-semibold">Passage:</span> {passageRef}{" "}
                    ({assignment.translation.toUpperCase()})
                </div>
                {assignment.dueDate && (
                    <div>
                        <span className="font-semibold">Due:</span>{" "}
                        {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                )}
                <div>
                    <span className="font-semibold">Status:</span>{" "}
                    {assignment.state}
                </div>
                <div>
                    <span className="font-semibold">Max Points:</span>{" "}
                    {assignment.maxPoints}
                </div>
            </div>

            {/* Publish Button for Draft Assignments */}
            {assignment.state === "DRAFT" && (
                <div className="mb-6 space-y-3">
                    <Button
                        onClick={() => {
                            void handlePublish()
                        }}
                        isLoading={isPublishing}
                        loadingLabel="Publishing"
                        disabled={isPublishing}
                    >
                        Publish Assignment
                    </Button>
                    <p className="mt-2 text-sm opacity-75">
                        Publishing will make this assignment visible to
                        students.
                    </p>
                </div>
            )}

            {/* Student Progress */}
            <div className="not-prose">
                <h2 className="mb-4 text-xl font-semibold">Student Progress</h2>

                {students.length === 0 ? (
                    <p className="opacity-75">
                        No students enrolled in this course.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {students.map((student, idx) => (
                            <div
                                key={idx}
                                className="border-primary bg-secondary border-2 p-4"
                            >
                                <div className="mb-3 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="font-semibold">
                                            {student.studentName ||
                                                student.studentEmail}
                                        </div>
                                        {student.studentName && (
                                            <div className="text-sm opacity-75">
                                                {student.studentEmail}
                                            </div>
                                        )}
                                    </div>
                                    {student.isCompleted && (
                                        <div className="text-success text-sm font-medium">
                                            ✓ Completed
                                        </div>
                                    )}
                                </div>

                                {/* Completion Meter */}
                                <div className="mb-3">
                                    <Meter
                                        value={student.completionPercentage}
                                        label="Progress"
                                        className="w-full"
                                    />
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="opacity-75">
                                            Verses:
                                        </span>{" "}
                                        {student.completedVerses} /{" "}
                                        {student.totalVerses}
                                    </div>
                                    {student.averageWpm !== null && (
                                        <div>
                                            <span className="opacity-75">
                                                WPM:
                                            </span>{" "}
                                            {student.averageWpm}
                                        </div>
                                    )}
                                    {student.averageAccuracy !== null && (
                                        <div>
                                            <span className="opacity-75">
                                                Accuracy:
                                            </span>{" "}
                                            {student.averageAccuracy}%
                                        </div>
                                    )}
                                    {student.startedAt && (
                                        <div>
                                            <span className="opacity-75">
                                                Started:
                                            </span>{" "}
                                            {new Date(
                                                student.startedAt,
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
