"use client"

import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"

import {
    approveOrganizationTeacher,
    fetchOrganizationUsers,
    promoteOrganizationTeacherToAdmin,
} from "./actions"

function formatRoleLabel(role: string): string {
    switch (role) {
        case "ORG_ADMIN":
            return "Admin"
        case "TEACHER":
            return "Teacher"
        case "STUDENT":
            return "Student"
        default:
            return role
    }
}

function formatStatusLabel(status: string): string {
    switch (status) {
        case "PENDING":
            return "Pending"
        case "APPROVED":
            return "Approved"
        case "REJECTED":
            return "Rejected"
        default:
            return status
    }
}

function StatusCell({ status }: { status: string }) {
    if (status === "APPROVED") {
        return (
            <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{formatStatusLabel(status)}</span>
            </span>
        )
    }

    if (status === "PENDING") {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm opacity-75">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{formatStatusLabel(status)}</span>
            </span>
        )
    }

    return (
        <span className="text-error inline-flex items-center gap-1.5 text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{formatStatusLabel(status)}</span>
        </span>
    )
}

function isClassroomConnected(user: {
    role: string
    hasTeacherConnection: boolean
    hasStudentConnection: boolean
}): boolean {
    if (user.role === "STUDENT") {
        return user.hasStudentConnection
    }

    return user.hasTeacherConnection
}

export function ClientPage() {
    const nonAdminActionTooltip =
        "You have to be an admin to manage teacher roles."
    const queryClient = useQueryClient()
    const usersQuery = useQuery({
        queryKey: ["classroom-organization-users"],
        queryFn: fetchOrganizationUsers,
    })

    const approveMutation = useMutation({
        mutationFn: (userId: string) => approveOrganizationTeacher(userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["classroom-organization-users"],
            })
        },
    })

    const promoteMutation = useMutation({
        mutationFn: (userId: string) =>
            promoteOrganizationTeacherToAdmin(userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["classroom-organization-users"],
            })
        },
    })

    function renderActionButton(
        label: "Approve" | "Make Admin",
        isLoading: boolean,
        onClick: () => void,
    ) {
        if (usersQuery.data?.isOrgAdmin) {
            return (
                <Button
                    onClick={onClick}
                    isLoading={isLoading}
                    loadingLabel={label === "Approve" ? "Approving" : "Saving"}
                >
                    {label}
                </Button>
            )
        }

        return (
            <Tooltip>
                <TooltipTrigger
                    render={<span className="inline-flex cursor-not-allowed" />}
                >
                    <Button
                        disabled
                        className="pointer-events-none disabled:cursor-not-allowed"
                    >
                        {label}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{nonAdminActionTooltip}</TooltipContent>
            </Tooltip>
        )
    }

    function renderUserActions(user: {
        userId: string
        role: string
        status: string
    }) {
        const isPendingTeacher =
            user.role === "TEACHER" && user.status === "PENDING"
        if (isPendingTeacher) {
            return renderActionButton(
                "Approve",
                approveMutation.isPending &&
                    approveMutation.variables === user.userId,
                () => {
                    approveMutation.mutate(user.userId)
                },
            )
        }

        const isApprovedTeacher =
            user.role === "TEACHER" && user.status === "APPROVED"
        if (isApprovedTeacher) {
            return renderActionButton(
                "Make Admin",
                promoteMutation.isPending &&
                    promoteMutation.variables === user.userId,
                () => {
                    promoteMutation.mutate(user.userId)
                },
            )
        }

        return <span className="opacity-50">-</span>
    }

    if (usersQuery.isLoading) {
        return <Loading />
    }

    if (usersQuery.isError || !usersQuery.data) {
        return (
            <div className="not-prose border-error bg-secondary border-2 p-4">
                <p className="text-error">
                    {usersQuery.error instanceof Error
                        ? usersQuery.error.message
                        : "Failed to load organization users"}
                </p>
            </div>
        )
    }

    return (
        <div>
            <nav className="not-prose mb-6 flex items-center justify-start text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>Organization</span>
            </nav>

            <h1>Organization</h1>
            <p>
                Domain: <span>{usersQuery.data.organizationDomain}</span>
            </p>

            <div className="not-prose border-primary bg-secondary overflow-x-auto border-2">
                <TooltipProvider>
                    <Table className="w-max min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    Connected to Google Classroom
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersQuery.data.users.map(user => (
                                <TableRow key={user.userId}>
                                    <TableCell>
                                        {user.name ?? "Unnamed user"}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {formatRoleLabel(user.role)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusCell status={user.status} />
                                    </TableCell>
                                    <TableCell>
                                        {isClassroomConnected(user)
                                            ? "Yes"
                                            : "No"}
                                    </TableCell>
                                    <TableCell>
                                        {renderUserActions(user)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </div>
        </div>
    )
}
