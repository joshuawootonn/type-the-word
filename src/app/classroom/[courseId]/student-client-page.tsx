"use client"

import NextLink from "next/link"
import { useCallback, useEffect, useState } from "react"

import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Link } from "~/components/ui/link"
import { Meter } from "~/components/ui/meter"
import toProperCase from "~/lib/toProperCase"

import { type StudentAssignment } from "../../api/classroom/schemas"
import { fetchStudentAssignments } from "./student-actions"

interface StudentClientPageProps {
    courseId: string
    courseName: string
}

export function StudentClientPage({
    courseId,
    courseName,
}: StudentClientPageProps) {
    const [data, setData] = useState<{
        current: StudentAssignment[]
        completed: StudentAssignment[]
        pastDue: StudentAssignment[]
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadAssignments = useCallback(async () => {
        try {
            const result = await fetchStudentAssignments(courseId)
            setData(result)
        } catch (_err) {
            setError("Failed to load assignments")
        } finally {
            setIsLoading(false)
        }
    }, [courseId])

    useEffect(() => {
        void loadAssignments()
    }, [loadAssignments])

    if (isLoading) {
        return <Loading />
    }

    if (error || !data) {
        return (
            <ClassroomNotice
                variant="error"
                message={error || "Failed to load assignments"}
                linkHref="/classroom/dashboard"
                linkLabel="Back to Dashboard"
            />
        )
    }

    const totalAssignments =
        data.current.length + data.completed.length + data.pastDue.length

    return (
        <div>
            {/* Breadcrumbs */}
            <nav className="not-prose mb-6 text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>{courseName}</span>
            </nav>

            <h1>{courseName}</h1>

            {totalAssignments === 0 ? (
                <p className="opacity-75">No assignments yet.</p>
            ) : (
                <div className="not-prose space-y-8">
                    {/* Current Assignments */}
                    {data.current.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">
                                Current Assignments
                            </h2>
                            <div className="space-y-3">
                                {data.current.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        courseId={courseId}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Assignments */}
                    {data.completed.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">
                                Completed Assignments
                            </h2>
                            <div className="space-y-3">
                                {data.completed.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        courseId={courseId}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Due Assignments */}
                    {data.pastDue.length > 0 && (
                        <details className="space-y-4 border-2 border-primary bg-secondary p-4">
                            <summary className="cursor-pointer text-xl font-semibold">
                                Past Due Assignments ({data.pastDue.length})
                            </summary>
                            <div className="mt-4 space-y-3">
                                {data.pastDue.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        courseId={courseId}
                                    />
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}
        </div>
    )
}

function AssignmentCard({
    assignment,
    courseId,
}: {
    assignment: StudentAssignment
    courseId: string
}) {
    const passageRef = `${toProperCase(assignment.book.split("_").join(" "))} ${assignment.startChapter}:${assignment.startVerse}-${assignment.endChapter}:${assignment.endVerse}`
    const isCompleted = assignment.isCompleted === 1

    return (
        <NextLink
            href={`/classroom/${courseId}/assignment/${assignment.id}`}
            className="svg-outline relative block border-2 border-primary bg-secondary p-4 no-underline"
        >
            <div className="mb-2 flex items-start justify-between gap-4">
                <div className="flex-grow">
                    <div className="font-semibold text-primary">
                        {assignment.title}
                    </div>
                    <div className="text-sm text-primary">
                        {passageRef} ({assignment.translation.toUpperCase()})
                    </div>
                </div>
                {isCompleted && (
                    <div className="text-sm font-medium text-success">
                        ✓ Completed
                    </div>
                )}
            </div>

            {assignment.dueDate && (
                <div className="mb-2 text-sm text-primary">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
            )}

            {assignment.hasStarted && (
                <>
                    <div className="mb-2">
                        <Meter
                            value={assignment.completionPercentage}
                            label="Progress"
                            className="w-full"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-primary">
                        <div>
                            <span className="opacity-75">Verses:</span>{" "}
                            {assignment.completedVerses ?? 0} /{" "}
                            {assignment.totalVerses}
                        </div>
                        {assignment.averageWpm !== null && (
                            <div>
                                <span className="opacity-75">WPM:</span>{" "}
                                {assignment.averageWpm}
                            </div>
                        )}
                        {assignment.averageAccuracy !== null && (
                            <div>
                                <span className="opacity-75">Accuracy:</span>{" "}
                                {assignment.averageAccuracy}%
                            </div>
                        )}
                    </div>
                </>
            )}
        </NextLink>
    )
}
