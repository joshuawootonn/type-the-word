"use client"

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import NextLink from "next/link"
import { useCallback, useMemo, useState } from "react"

import { AssignmentStatusBadge } from "~/components/assignment-status-badge"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import toProperCase from "~/lib/toProperCase"

import { type Assignment } from "../../api/classroom/schemas"
import { fetchAssignments, publishAssignment } from "./actions"

interface TeacherClientPageProps {
    courseId: string
    courseName: string
}

export function TeacherClientPage({
    courseId,
    courseName,
}: TeacherClientPageProps) {
    const [publishingId, setPublishingId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // Single unified query with pagination
    const assignmentsQuery = useInfiniteQuery({
        queryKey: ["assignments", courseId],
        queryFn: ({ pageParam = 0 }) =>
            fetchAssignments({ courseId, page: pageParam, limit: 10 }),
        getNextPageParam: lastPage =>
            lastPage.pagination.hasMore
                ? lastPage.pagination.page + 1
                : undefined,
        initialPageParam: 0,
    })

    const handlePublish = useCallback(
        async (assignmentId: string) => {
            setPublishingId(assignmentId)
            try {
                await publishAssignment(assignmentId)
                // Invalidate query to refetch
                await queryClient.invalidateQueries({
                    queryKey: ["assignments", courseId],
                })
            } catch (_err) {
                // Error handling
            } finally {
                setPublishingId(null)
            }
        },
        [courseId, queryClient],
    )

    // Extract all assignments from pages (flat list)
    const allAssignments = useMemo(
        () =>
            (assignmentsQuery.data?.pages.flatMap(page => page.assignments) ??
                []) as Assignment[],
        [assignmentsQuery.data],
    )

    const isInitialLoading = assignmentsQuery.isLoading
    const hasError = !!assignmentsQuery.error
    const totalAssignments = allAssignments.length

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

            {isInitialLoading ? (
                <Loading />
            ) : hasError ? (
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">Failed to load assignments</p>
                </div>
            ) : totalAssignments === 0 ? (
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
                <div className="not-prose space-y-3">
                    {allAssignments.map(assignment => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            courseId={courseId}
                            onPublish={handlePublish}
                            isPublishing={publishingId === assignment.id}
                        />
                    ))}
                    {assignmentsQuery.hasNextPage && (
                        <Button
                            onClick={() => assignmentsQuery.fetchNextPage()}
                            isLoading={assignmentsQuery.isFetchingNextPage}
                            loadingLabel="Loading"
                            className="mt-3 w-full"
                        >
                            Load More
                        </Button>
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
                    <div className="flex items-center gap-2">
                        <div className="font-semibold text-primary">
                            {assignment.title}
                        </div>
                        <AssignmentStatusBadge
                            state={assignment.state}
                            dueDate={assignment.dueDate}
                        />
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
