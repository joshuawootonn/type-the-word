export type StudentAssignmentDisplayStatus =
    | "pastDue"
    | "current"
    | "noDueDate"
    | "completed"

interface StudentAssignmentStatusInput {
    dueDate: string | null
    isCompleted: number | null | undefined
    now?: Date
}

export function getStudentAssignmentDisplayStatus({
    dueDate,
    isCompleted,
    now = new Date(),
}: StudentAssignmentStatusInput): StudentAssignmentDisplayStatus {
    if (isCompleted === 1) {
        return "completed"
    }

    if (dueDate == null) {
        return "noDueDate"
    }

    if (new Date(dueDate) < now) {
        return "pastDue"
    }

    return "current"
}
