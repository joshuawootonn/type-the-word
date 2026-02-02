"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import NextLink from "next/link"
import { useMemo } from "react"

import { AssignmentStatusBadge } from "~/components/assignment-status-badge"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import { Meter } from "~/components/ui/meter"
import toProperCase from "~/lib/toProperCase"

import { type StudentAssignment } from "../../api/classroom/schemas"
import { fetchAssignments } from "./actions"

interface StudentClientPageProps {
    courseId: string
    courseName: string
}

export function StudentClientPage({
    courseId,
    courseName,
}: StudentClientPageProps) {
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

    // Extract all assignments from pages (flat list)
    const allAssignments = useMemo(
        () =>
            (assignmentsQuery.data?.pages.flatMap(page => page.assignments) ??
                []) as StudentAssignment[],
        [assignmentsQuery.data],
    )

    if (assignmentsQuery.isLoading) {
        return <Loading />
    }

    if (assignmentsQuery.error) {
        return (
            <ClassroomNotice
                variant="error"
                message="Failed to load assignments"
                linkHref="/classroom/dashboard"
                linkLabel="Back to Dashboard"
            />
        )
    }

    const totalAssignments = allAssignments.length

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
                <div className="not-prose space-y-3">
                    {allAssignments.map(assignment => (
                        <AssignmentCard
                            key={assignment.id}
                            assignment={assignment}
                            courseId={courseId}
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
}: {
    assignment: StudentAssignment
    courseId: string
}) {
    const passageRef = `${toProperCase(assignment.book.split("_").join(" "))} ${assignment.startChapter}:${assignment.startVerse}-${assignment.endChapter}:${assignment.endVerse}`

    return (
        <NextLink
            href={`/classroom/${courseId}/assignment/${assignment.id}`}
            className="svg-outline relative block border-2 border-primary bg-secondary p-4 no-underline"
        >
            <div className="mb-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="font-semibold text-primary">
                        {assignment.title}
                    </div>
                    <AssignmentStatusBadge
                        state={assignment.state}
                        dueDate={assignment.dueDate}
                        isCompleted={assignment.isCompleted}
                        isStudent
                    />
                </div>
                <div className="text-sm text-primary">
                    {passageRef} ({assignment.translation.toUpperCase()})
                </div>
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
