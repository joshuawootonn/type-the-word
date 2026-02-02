"use client"

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
    // For students, compute status from PUBLISHED state
    if (isStudent && state === "PUBLISHED") {
        const now = new Date()
        const due = dueDate ? new Date(dueDate) : null

        if (isCompleted === 1) {
            return (
                <span className="inline-block border-2 border-success bg-secondary px-2 py-1 text-xs font-semibold text-success">
                    Completed
                </span>
            )
        } else if (due && due < now) {
            return (
                <span className="inline-block border-2 border-error bg-secondary px-2 py-1 text-xs font-semibold text-error">
                    Past Due
                </span>
            )
        } else {
            return (
                <span className="inline-block border-2 border-primary bg-secondary px-2 py-1 text-xs font-semibold text-primary">
                    Current
                </span>
            )
        }
    }

    // For teachers, show state
    if (state === "DRAFT") {
        return (
            <span className="inline-block border-2 border-primary bg-secondary px-2 py-1 text-xs font-semibold opacity-60">
                Draft
            </span>
        )
    } else if (state === "PUBLISHED") {
        return (
            <span className="inline-block border-2 border-primary bg-secondary px-2 py-1 text-xs font-semibold text-primary">
                Published
            </span>
        )
    } else {
        return (
            <span className="inline-block border-2 border-primary bg-secondary px-2 py-1 text-xs font-semibold opacity-40">
                Archived
            </span>
        )
    }
}
