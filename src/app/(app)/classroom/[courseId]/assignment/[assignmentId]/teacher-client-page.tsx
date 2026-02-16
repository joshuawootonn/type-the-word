"use client"

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"

import { type AssignmentDetail } from "~/app/api/classroom/schemas"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Link } from "~/components/ui/link"
import { Meter } from "~/components/ui/meter"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import toProperCase from "~/lib/toProperCase"

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
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")

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

    const columns = useMemo<ColumnDef<AssignmentDetail["students"][number]>[]>(
        () => [
            {
                id: "student",
                header: "Student",
                accessorFn: row => row.studentName ?? row.studentEmail,
                sortingFn: "alphanumeric",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-semibold">
                            {row.original.studentName ??
                                row.original.studentEmail}
                        </span>
                        {row.original.studentName && (
                            <span className="text-sm opacity-75">
                                {row.original.studentEmail}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                id: "progress",
                header: "Progress",
                accessorKey: "completionPercentage",
                cell: ({ row }) => (
                    <div className="min-w-48">
                        <Meter
                            value={row.original.completionPercentage}
                            label="Progress"
                            className="w-full"
                        />
                    </div>
                ),
            },
            {
                id: "verses",
                header: "Verses",
                accessorFn: row => row.completedVerses / row.totalVerses,
                cell: ({ row }) =>
                    `${row.original.completedVerses} / ${row.original.totalVerses}`,
            },
            {
                id: "wpm",
                header: "WPM",
                accessorFn: row => row.averageWpm ?? -1,
                cell: ({ row }) => row.original.averageWpm ?? "-",
            },
            {
                id: "accuracy",
                header: "Accuracy",
                accessorFn: row => row.averageAccuracy ?? -1,
                cell: ({ row }) =>
                    row.original.averageAccuracy !== null
                        ? `${row.original.averageAccuracy}%`
                        : "-",
            },
            {
                id: "startedAt",
                header: "Started",
                accessorFn: row => row.startedAt ?? "",
                cell: ({ row }) =>
                    row.original.startedAt
                        ? new Date(row.original.startedAt).toLocaleDateString()
                        : "-",
            },
            {
                id: "status",
                header: "Status",
                accessorFn: row => (row.isCompleted ? 1 : 0),
                cell: ({ row }) =>
                    row.original.isCompleted ? (
                        <span className="text-success font-medium">
                            Completed
                        </span>
                    ) : (
                        <span className="opacity-75">In progress</span>
                    ),
            },
        ],
        [],
    )
    const table = useReactTable({
        data: data?.students ?? [],
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, _columnId, filterValue) => {
            const value = String(filterValue).trim().toLowerCase()
            if (!value) return true
            const name = row.original.studentName ?? ""
            const email = row.original.studentEmail
            return `${name} ${email}`.toLowerCase().includes(value)
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

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
                    <div className="space-y-3">
                        <Input
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            placeholder="Search by student name or email..."
                            aria-label="Filter students"
                        />
                        <div className="border-primary bg-secondary overflow-x-auto border-2">
                            <Table>
                                <TableHeader>
                                    {table
                                        .getHeaderGroups()
                                        .map(headerGroup => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(
                                                    header => (
                                                        <TableHead
                                                            key={header.id}
                                                        >
                                                            {header.isPlaceholder ? null : (
                                                                <button
                                                                    type="button"
                                                                    onClick={header.column.getToggleSortingHandler()}
                                                                    disabled={
                                                                        !header.column.getCanSort()
                                                                    }
                                                                    className="inline-flex items-center gap-1 disabled:cursor-default"
                                                                >
                                                                    {flexRender(
                                                                        header
                                                                            .column
                                                                            .columnDef
                                                                            .header,
                                                                        header.getContext(),
                                                                    )}
                                                                    {header.column.getCanSort() && (
                                                                        <span className="text-xs opacity-75">
                                                                            {header.column.getIsSorted() ===
                                                                            "asc"
                                                                                ? "▲"
                                                                                : header.column.getIsSorted() ===
                                                                                    "desc"
                                                                                  ? "▼"
                                                                                  : "↕"}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </TableHead>
                                                    ),
                                                )}
                                            </TableRow>
                                        ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.map(row => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {table.getRowModel().rows.length === 0 && (
                            <p className="text-sm opacity-75">
                                No students match this filter.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
