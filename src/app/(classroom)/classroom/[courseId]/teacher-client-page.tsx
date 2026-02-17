"use client"

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { type Assignment } from "~/app/api/classroom/schemas"
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

import { fetchAssignments, publishAssignment } from "./actions"

interface TeacherClientPageProps {
    courseId: string
    courseName: string
}

export function TeacherClientPage({
    courseId,
    courseName,
}: TeacherClientPageProps) {
    const router = useRouter()
    const [publishingId, setPublishingId] = useState<string | null>(null)
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")
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
    const globalFilterValue = globalFilter.trim().toLowerCase()
    const columns = useMemo<ColumnDef<Assignment>[]>(
        () => [
            {
                id: "title",
                header: "Title",
                accessorKey: "title",
                cell: ({ row }) => (
                    <span className="block truncate">{row.original.title}</span>
                ),
                sortingFn: "alphanumeric",
            },
            {
                id: "passage",
                header: "Passage",
                accessorFn: row => formatPassageRef(row),
                cell: ({ row }) => (
                    <span className="block truncate">
                        {formatPassageRef(row.original)}
                    </span>
                ),
                sortingFn: "alphanumeric",
            },
            {
                id: "translation",
                header: "Translation",
                accessorFn: row => row.translation.toUpperCase(),
                cell: ({ row }) => (
                    <span className="block truncate">
                        {row.original.translation.toUpperCase()}
                    </span>
                ),
                sortingFn: "alphanumeric",
            },
            {
                id: "status",
                header: "Status",
                accessorKey: "state",
                cell: ({ row }) => (
                    <span className="block truncate">
                        {formatState(row.original.state)}
                    </span>
                ),
            },
            {
                id: "dueDate",
                header: "Due Date",
                accessorFn: row => row.dueDate ?? "",
                cell: ({ row }) =>
                    row.original.dueDate
                        ? new Date(row.original.dueDate).toLocaleDateString()
                        : "No due date",
            },
            {
                id: "completion",
                header: "Completion",
                accessorFn: row =>
                    row.submissionCount > 0
                        ? row.completedCount / row.submissionCount
                        : -1,
                cell: ({ row }) =>
                    row.original.state === "PUBLISHED" &&
                    row.original.submissionCount > 0 ? (
                        <div className="flex h-full min-w-44 items-center justify-center">
                            <Meter
                                type="fractional"
                                value={row.original.completedCount}
                                total={row.original.submissionCount}
                                label="Completion"
                                variant="inline"
                                className="w-full"
                            />
                        </div>
                    ) : null,
            },
            {
                id: "actions",
                header: "Actions",
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.state === "DRAFT" ? (
                        <Button
                            onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                void handlePublish(row.original.id)
                            }}
                            isLoading={publishingId === row.original.id}
                            loadingLabel="Publishing"
                            className="text-sm"
                        >
                            Publish
                        </Button>
                    ) : null,
            },
        ],
        [handlePublish, publishingId],
    )
    const table = useReactTable({
        data: allAssignments,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: row => {
            if (!globalFilterValue) return true

            const assignment = row.original
            const searchable =
                `${assignment.title} ${formatPassageRef(assignment)} ${assignment.translation}`
                    .toLowerCase()
                    .trim()
            return searchable.includes(globalFilterValue)
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    return (
        <div>
            {/* Breadcrumbs */}
            <nav className="not-prose mb-6 flex items-center justify-center text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>{courseName}</span>

                <div className="grow" />
                <Link href={`/classroom/assign?courseId=${courseId}`}>
                    Create Assignment
                </Link>
            </nav>

            <h1 className="">{courseName}</h1>

            {isInitialLoading ? (
                <Loading />
            ) : hasError ? (
                <div className="not-prose border-error bg-secondary border-2 p-6">
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
                    <Input
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                        placeholder="Search by title or passage..."
                        aria-label="Filter assignments"
                    />
                    <div className="border-primary bg-secondary overflow-x-auto border-2">
                        <Table className="table-fixed">
                            <TableHeader>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableHead
                                                key={header.id}
                                                className={getHeaderClassName(
                                                    header.column.id,
                                                )}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <button
                                                        type="button"
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        disabled={
                                                            !header.column.getCanSort()
                                                        }
                                                        className="inline-flex w-full items-center gap-1 overflow-hidden text-left disabled:cursor-default"
                                                    >
                                                        <span className="truncate">
                                                            {flexRender(
                                                                header.column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext(),
                                                            )}
                                                        </span>
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
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.map(row => (
                                    <TableRow
                                        key={row.id}
                                        onClick={() =>
                                            router.push(
                                                `/classroom/${courseId}/assignment/${row.original.id}`,
                                            )
                                        }
                                        className="hover:bg-secondary/70 cursor-pointer"
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <TableCell
                                                key={cell.id}
                                                className={getCellClassName(
                                                    cell.column.id,
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
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
                            No assignments match this filter.
                        </p>
                    )}
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

function formatPassageRef(assignment: Assignment): string {
    return `${toProperCase(assignment.book.split("_").join(" "))} ${assignment.startChapter}:${assignment.startVerse}-${assignment.endChapter}:${assignment.endVerse}`
}

function formatState(state: Assignment["state"]): string {
    if (state === "DRAFT") return "Draft"
    if (state === "PUBLISHED") return "Published"
    return "Deleted"
}

function getHeaderClassName(columnId: string): string {
    switch (columnId) {
        case "title":
            return "w-[18%] whitespace-nowrap overflow-hidden"
        case "passage":
            return "w-[20%] whitespace-nowrap overflow-hidden"
        case "translation":
            return "w-[10%] whitespace-nowrap overflow-hidden"
        case "status":
            return "w-[10%] whitespace-nowrap overflow-hidden"
        case "dueDate":
            return "w-[12%] whitespace-nowrap overflow-hidden"
        case "progress":
            return "w-[20%] whitespace-nowrap overflow-hidden"
        case "actions":
            return "w-[10%] whitespace-nowrap overflow-hidden"
        default:
            return "whitespace-nowrap overflow-hidden"
    }
}

function getCellClassName(columnId: string): string {
    if (columnId === "progress") {
        return "whitespace-nowrap"
    }

    if (columnId === "actions") {
        return "whitespace-nowrap"
    }

    return "whitespace-nowrap overflow-hidden text-ellipsis"
}
