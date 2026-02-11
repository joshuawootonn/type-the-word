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
                <span className="border-success bg-secondary text-success inline-block border-2 px-2 py-1 text-xs font-semibold">
                    Completed
                </span>
            )
        } else if (due && due < now) {
            return (
                <span className="border-error bg-secondary text-error inline-block border-2 px-2 py-1 text-xs font-semibold">
                    Past Due
                </span>
            )
        } else {
            return (
                <span className="border-primary bg-secondary text-primary inline-block border-2 px-2 py-1 text-xs font-semibold">
                    Current
                </span>
            )
        }
    }

    // For teachers, show state
    if (state === "DRAFT") {
        return (
            <span className="border-primary bg-secondary inline-block border-2 px-2 py-1 text-xs font-semibold opacity-60">
                Draft
            </span>
        )
    } else if (state === "PUBLISHED") {
        return (
            <span className="border-primary bg-secondary text-primary inline-block border-2 px-2 py-1 text-xs font-semibold">
                Published
            </span>
        )
    } else {
        return (
            <span className="border-primary bg-secondary inline-block border-2 px-2 py-1 text-xs font-semibold opacity-40">
                Deleted
            </span>
        )
    }
}
