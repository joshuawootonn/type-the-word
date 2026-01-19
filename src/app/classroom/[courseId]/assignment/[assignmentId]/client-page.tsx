"use client"

import { useCallback, useEffect, useState } from "react"

import { Loading } from "~/components/loading"
import { Link } from "~/components/ui/link"
import { Meter } from "~/components/ui/meter"
import toProperCase from "~/lib/toProperCase"

import { type AssignmentDetail } from "../../../../api/classroom/schemas"
import { fetchAssignmentDetail } from "./actions"

interface ClientPageProps {
    assignmentId: string
    courseId: string
    courseName: string
}

export function ClientPage({
    assignmentId,
    courseId,
    courseName,
}: ClientPageProps) {
    const [data, setData] = useState<AssignmentDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    if (isLoading) {
        return <Loading />
    }

    if (error || !data) {
        return (
            <div>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        {error || "Assignment not found"}
                    </p>
                    <Link href={`/classroom/${courseId}`}>Back to Course</Link>
                </div>
            </div>
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
                                className="border-2 border-primary bg-secondary p-4"
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
                                        <div className="text-sm font-medium text-success">
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
