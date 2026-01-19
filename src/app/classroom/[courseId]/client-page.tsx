"use client"

import NextLink from "next/link"
import { useCallback, useEffect, useState } from "react"

import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import toProperCase from "~/lib/toProperCase"

import { type Assignment } from "../../api/classroom/schemas"
import { fetchCourseAssignments, publishAssignment } from "./actions"

interface ClientPageProps {
    courseId: string
    courseName: string
}

export function ClientPage({ courseId, courseName }: ClientPageProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [publishingId, setPublishingId] = useState<string | null>(null)

    const loadAssignments = useCallback(async () => {
        try {
            const result = await fetchCourseAssignments(courseId)
            setAssignments(result.assignments)
        } catch (_err) {
            setError("Failed to load assignments")
        } finally {
            setIsLoading(false)
        }
    }, [courseId])

    useEffect(() => {
        void loadAssignments()
    }, [loadAssignments])

    const handlePublish = useCallback(
        async (assignmentId: string) => {
            setPublishingId(assignmentId)
            try {
                await publishAssignment(assignmentId)
                // Reload assignments to reflect new state
                await loadAssignments()
            } catch (_err) {
                setError("Failed to publish assignment")
            } finally {
                setPublishingId(null)
            }
        },
        [loadAssignments],
    )

    // Group assignments by state
    const now = new Date()
    const currentAssignments = assignments.filter(
        a =>
            a.state === "PUBLISHED" &&
            (!a.dueDate || new Date(a.dueDate) >= now),
    )
    const draftAssignments = assignments.filter(a => a.state === "DRAFT")
    const completedAssignments = assignments.filter(
        a => a.state === "PUBLISHED" && a.dueDate && new Date(a.dueDate) < now,
    )
    const deletedAssignments = assignments.filter(a => a.state === "DELETED")
    const archivedAssignments = [...completedAssignments, ...deletedAssignments]

    return (
        <div>
            {/* Breadcrumbs */}
            <nav className="not-prose mb-6 flex items-center justify-center text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>{courseName}</span>

                <div className="flex-grow" />
                <Link href={`/classroom/assign?courseId=${courseId}`}>
                    Create Assignment
                </Link>
            </nav>

            <h1 className="">{courseName}</h1>

            {isLoading ? (
                <Loading />
            ) : error ? (
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">{error}</p>
                </div>
            ) : assignments.length === 0 ? (
                <div className="not-prose">
                    <p>No assignments yet.</p>
                    <Link
                        href={`/classroom/assign?courseId=${courseId}`}
                        className="mt-4"
                    >
                        Create Assignment
                    </Link>
                </div>
            ) : (
                <div className="not-prose space-y-8">
                    {/* Current Assignments */}
                    {currentAssignments.length > 0 && (
                        <section>
                            <h2 className="mb-4 text-xl font-semibold">
                                Current Assignments
                            </h2>
                            <div className="space-y-3">
                                {currentAssignments.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        courseId={courseId}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Draft Assignments */}
                    {draftAssignments.length > 0 && (
                        <section>
                            <h2 className="mb-4 text-xl font-semibold">
                                Draft Assignments
                            </h2>
                            <div className="space-y-3">
                                {draftAssignments.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        courseId={courseId}
                                        onPublish={handlePublish}
                                        isPublishing={
                                            publishingId === assignment.id
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Archived Assignments (Expandable) */}
                    {archivedAssignments.length > 0 && (
                        <details className="border-t-2 border-primary pt-6">
                            <summary className="cursor-pointer font-semibold">
                                Archived Assignments (
                                {archivedAssignments.length})
                            </summary>
                            <div className="mt-4 space-y-3">
                                {archivedAssignments.map(assignment => (
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
    onPublish,
    isPublishing,
}: {
    assignment: Assignment
    courseId: string
    onPublish?: (id: string) => void
    isPublishing?: boolean
}) {
    const passageRef = `${toProperCase(assignment.book.split("_").join(" "))} ${assignment.startChapter}:${assignment.startVerse}-${assignment.endChapter}:${assignment.endVerse}`

    return (
        <div className="relative border-2 border-primary bg-secondary">
            <NextLink
                href={`/classroom/${courseId}/assignment/${assignment.id}`}
                className="block p-4 no-underline"
            >
                <div className="flex flex-col items-start justify-between gap-2">
                    <div className="font-semibold text-primary">
                        {assignment.title}
                    </div>
                    <div className="text-sm opacity-75">
                        {passageRef} ({assignment.translation.toUpperCase()})
                    </div>
                    {assignment.dueDate && (
                        <div className="text-sm opacity-75">
                            Due:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                    )}
                    {assignment.state === "PUBLISHED" &&
                        assignment.submissionCount > 0 && (
                            <div className="text-sm">
                                <span className="font-medium">
                                    {assignment.completedCount} /{" "}
                                    {assignment.submissionCount}
                                </span>{" "}
                                completed ({assignment.averageCompletion}%
                                average)
                            </div>
                        )}

                    {assignment.state === "DRAFT" && (
                        <div className="text-sm opacity-75">
                            Draft - Not visible to students
                        </div>
                    )}
                </div>
            </NextLink>

            {assignment.state === "DRAFT" && onPublish && (
                <Button
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        onPublish(assignment.id)
                    }}
                    isLoading={!!isPublishing}
                    loadingLabel="Publishing"
                    className="absolute right-4 top-4 text-sm"
                >
                    Publish
                </Button>
            )}
        </div>
    )
}
