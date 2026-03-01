"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import NextLink from "next/link"
import { useMemo } from "react"

import { type StudentAssignment } from "~/app/api/classroom/schemas"
import { AssignmentStatusBadge } from "~/components/assignment-status-badge"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import { Meter } from "~/components/ui/meter"
import {
    type StudentAssignmentDisplayStatus,
    getStudentAssignmentDisplayStatus,
} from "~/lib/classroom-assignment-status"
import toProperCase from "~/lib/toProperCase"

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
    const assignmentGroups = useMemo(
        () => buildAssignmentGroups(allAssignments),
        [allAssignments],
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
                    {assignmentGroups.map(group => (
                        <section key={group.id} className="space-y-2">
                            <h2 className="text-base font-semibold">
                                {group.title}
                            </h2>
                            <div className="space-y-3">
                                {group.assignments.map(assignment => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        courseId={courseId}
                                    />
                                ))}
                            </div>
                        </section>
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
            className="svg-outline border-primary bg-secondary relative block border-2 p-4 no-underline"
        >
            <div className="mb-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-primary font-semibold">
                        {assignment.title}
                    </div>
                    <AssignmentStatusBadge
                        state={assignment.state}
                        dueDate={assignment.dueDate}
                        isCompleted={assignment.isCompleted}
                        isStudent
                    />
                </div>
                <div className="text-primary text-sm">
                    {passageRef} ({assignment.translation.toUpperCase()})
                </div>
            </div>

            {assignment.dueDate && (
                <div className="text-primary mb-2 text-sm">
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
                    <div className="text-primary grid grid-cols-2 gap-3 text-sm">
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

function buildAssignmentGroups(assignments: StudentAssignment[]): Array<{
    id: StudentAssignmentDisplayStatus
    title: string
    assignments: StudentAssignment[]
}> {
    const grouped: Record<StudentAssignmentDisplayStatus, StudentAssignment[]> =
        {
            pastDue: [],
            current: [],
            noDueDate: [],
            completed: [],
        }

    assignments.forEach(assignment => {
        const status = getStudentAssignmentDisplayStatus({
            dueDate: assignment.dueDate,
            isCompleted: assignment.isCompleted,
        })
        grouped[status].push(assignment)
    })

    const orderedGroups: Array<{
        id: StudentAssignmentDisplayStatus
        title: string
        assignments: StudentAssignment[]
    }> = [
        { id: "pastDue", title: "Past Due", assignments: grouped.pastDue },
        { id: "current", title: "Current", assignments: grouped.current },
        {
            id: "noDueDate",
            title: "No Due Date",
            assignments: grouped.noDueDate,
        },
        { id: "completed", title: "Completed", assignments: grouped.completed },
    ]

    return orderedGroups.filter(group => group.assignments.length > 0)
}
