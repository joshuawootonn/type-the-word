"use client"

import {
    CheckCircle,
    Clock,
    WarningCircle,
    XCircle,
} from "@phosphor-icons/react"

import { getStudentAssignmentDisplayStatus } from "~/lib/classroom-assignment-status"

type AssignmentState = "DRAFT" | "PUBLISHED" | "DELETED"

interface AssignmentStatusBadgeProps {
    state: AssignmentState
    dueDate: string | null
    isCompleted?: number | null
    isStudent?: boolean
}

export function AssignmentStatusBadge({
    state,
    dueDate,
    isCompleted,
    isStudent = false,
}: AssignmentStatusBadgeProps) {
    // For students, compute status from assignment completion and due date.
    if (isStudent && state === "PUBLISHED") {
        const status = getStudentAssignmentDisplayStatus({
            dueDate,
            isCompleted,
        })

        if (status === "completed") {
            return (
                <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Completed</span>
                </span>
            )
        }

        if (status === "pastDue") {
            return (
                <span className="text-error inline-flex items-center gap-1.5 text-sm font-medium">
                    <WarningCircle className="h-4 w-4 shrink-0" />
                    <span>Past Due</span>
                </span>
            )
        }

        if (status === "noDueDate") {
            return (
                <span className="inline-flex items-center gap-1.5 text-sm opacity-75">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>No Due Date</span>
                </span>
            )
        }

        return (
            <span className="inline-flex items-center gap-1.5 text-sm opacity-75">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Current</span>
            </span>
        )
    }

    if (state === "PUBLISHED") {
        return (
            <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Published</span>
            </span>
        )
    }

    if (state === "DRAFT") {
        return (
            <span className="inline-flex items-center gap-1.5 text-sm opacity-75">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Draft</span>
            </span>
        )
    }

    return (
        <span className="text-error inline-flex items-center gap-1.5 text-sm">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>Deleted</span>
        </span>
    )
}
