"use client"

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import NextLink from "next/link"
import { useCallback, useState } from "react"

import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import toProperCase from "~/lib/toProperCase"

import { type Assignment } from "../../api/classroom/schemas"
import { fetchCourseAssignments, publishAssignment } from "./actions"

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

    // Three separate infinite queries for each status
    const currentQuery = useInfiniteQuery({
        queryKey: ["assignments", courseId, "current"],
        queryFn: ({ pageParam = 0 }) =>
            fetchCourseAssignments({
                courseId,
                status: "current",
                startingAfter: pageParam,
            }),
        getNextPageParam: lastPage =>
            lastPage.hasMore ? lastPage.startingAfter : undefined,
        initialPageParam: 0,
    })

    const draftQuery = useInfiniteQuery({
        queryKey: ["assignments", courseId, "draft"],
        queryFn: ({ pageParam = 0 }) =>
            fetchCourseAssignments({
                courseId,
                status: "draft",
                startingAfter: pageParam,
            }),
        getNextPageParam: lastPage =>
            lastPage.hasMore ? lastPage.startingAfter : undefined,
        initialPageParam: 0,
    })

    const archivedQuery = useInfiniteQuery({
        queryKey: ["assignments", courseId, "archived"],
        queryFn: ({ pageParam = 0 }) =>
            fetchCourseAssignments({
                courseId,
                status: "archived",
                startingAfter: pageParam,
            }),
        getNextPageParam: lastPage =>
            lastPage.hasMore ? lastPage.startingAfter : undefined,
        initialPageParam: 0,
    })

    const handlePublish = useCallback(
        async (assignmentId: string) => {
            setPublishingId(assignmentId)
            try {
                await publishAssignment(assignmentId)
                // Invalidate all queries to refetch
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

    // Extract assignments from pages
    const currentAssignments =
        currentQuery.data?.pages.flatMap(page => page.assignments) ?? []
    const draftAssignments =
        draftQuery.data?.pages.flatMap(page => page.assignments) ?? []
    const archivedAssignments =
        archivedQuery.data?.pages.flatMap(page => page.assignments) ?? []

    const isInitialLoading =
        currentQuery.isLoading ||
        draftQuery.isLoading ||
        archivedQuery.isLoading
    const hasError =
        currentQuery.error || draftQuery.error || archivedQuery.error
    const totalAssignments =
        currentAssignments.length +
        draftAssignments.length +
        archivedAssignments.length

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
                            {currentQuery.hasNextPage && (
                                <Button
                                    onClick={() => currentQuery.fetchNextPage()}
                                    isLoading={currentQuery.isFetchingNextPage}
                                    loadingLabel="Loading"
                                    className="mt-3 w-full"
                                >
                                    Load More
                                </Button>
                            )}
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
                            {draftQuery.hasNextPage && (
                                <Button
                                    onClick={() => draftQuery.fetchNextPage()}
                                    isLoading={draftQuery.isFetchingNextPage}
                                    loadingLabel="Loading"
                                    className="mt-3 w-full"
                                >
                                    Load More
                                </Button>
                            )}
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
                            {archivedQuery.hasNextPage && (
                                <Button
                                    onClick={() =>
                                        archivedQuery.fetchNextPage()
                                    }
                                    isLoading={archivedQuery.isFetchingNextPage}
                                    loadingLabel="Loading"
                                    className="mt-3 w-full"
                                >
                                    Load More
                                </Button>
                            )}
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
