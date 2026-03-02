"use client"

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

import { approveOrganizationTeacher, fetchOrganizationUsers } from "./actions"

export function ClientPage() {
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
            <nav className="not-prose mb-6 flex items-center justify-center text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>Organization</span>
            </nav>

            <h1>Organization</h1>
            <p>
                Domain: <strong>{usersQuery.data.organizationDomain}</strong>
            </p>

            {usersQuery.data.pendingTeachers.length > 0 && (
                <div className="not-prose border-primary bg-secondary my-6 space-y-3 border-2 p-4">
                    <h2 className="m-0 text-lg font-semibold">
                        Pending Teachers
                    </h2>
                    <div className="space-y-2">
                        {usersQuery.data.pendingTeachers.map(teacher => (
                            <div
                                key={teacher.userId}
                                className="border-primary flex items-center justify-between gap-3 border-2 p-3"
                            >
                                <div className="min-w-0">
                                    <div className="font-semibold">
                                        {teacher.name ?? "Unnamed user"}
                                    </div>
                                    <div className="truncate text-sm">
                                        {teacher.email}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        approveMutation.mutate(teacher.userId)
                                    }}
                                    isLoading={
                                        approveMutation.isPending &&
                                        approveMutation.variables ===
                                            teacher.userId
                                    }
                                    loadingLabel="Approving"
                                >
                                    Approve
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="not-prose border-primary bg-secondary overflow-x-auto border-2">
                <Table className="w-max min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Teacher Connected</TableHead>
                            <TableHead>Student Connected</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usersQuery.data.users.map(user => (
                            <TableRow key={user.userId}>
                                <TableCell>
                                    {user.name ?? "Unnamed user"}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.status}</TableCell>
                                <TableCell>
                                    {user.hasTeacherConnection ? "Yes" : "No"}
                                </TableCell>
                                <TableCell>
                                    {user.hasStudentConnection ? "Yes" : "No"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
