import { eq } from "drizzle-orm"

import { getCourseWork } from "~/server/clients/classroom.client"
import { db } from "~/server/db"
import { classroomAssignment } from "~/server/db/schema"

export type AssignmentToSync = {
    id: string
    courseId: string
    courseWorkId: string
    title: string
    description: string | null
    dueDate: Date | null
    state: "DRAFT" | "PUBLISHED" | "DELETED"
}

export type SyncedAssignment<T extends AssignmentToSync> = T & {
    dueDate: Date | null
    state: "DRAFT" | "PUBLISHED" | "DELETED"
}

/**
 * Syncs assignments with future due dates or draft state with Google Classroom API
 * Updates the database if state, due date, title, or description has changed
 */
export async function syncFutureAssignments<T extends AssignmentToSync>(
    accessToken: string,
    assignments: T[],
): Promise<SyncedAssignment<T>[]> {
    const now = new Date()

    // Filter to assignments that need syncing: future due dates or drafts
    const assignmentsToSync = assignments.filter(
        a => a.state === "DRAFT" || !a.dueDate || a.dueDate >= now,
    )

    // Sync each assignment with Google Classroom
    const syncedAssignments = await Promise.all(
        assignmentsToSync.map(async assignment => {
            try {
                const courseWork = await getCourseWork(
                    accessToken,
                    assignment.courseId,
                    assignment.courseWorkId,
                )

                let dueDate: Date | null = null
                if (courseWork.dueDate) {
                    const hours = courseWork.dueTime?.hours ?? 23
                    const minutes = courseWork.dueTime?.minutes ?? 59
                    dueDate = new Date(
                        courseWork.dueDate.year,
                        courseWork.dueDate.month - 1,
                        courseWork.dueDate.day,
                        hours,
                        minutes,
                    )
                }

                const nextState =
                    courseWork.state === "DRAFT" ||
                    courseWork.state === "PUBLISHED" ||
                    courseWork.state === "DELETED"
                        ? courseWork.state
                        : assignment.state

                const nextTitle = courseWork.title ?? assignment.title
                const nextDescription =
                    courseWork.description ?? assignment.description

                // Check if anything changed
                const stateChanged = nextState !== assignment.state
                const dueDateChanged =
                    dueDate &&
                    assignment.dueDate?.getTime() !== dueDate.getTime()
                const titleChanged = nextTitle !== assignment.title
                const descriptionChanged =
                    nextDescription !== assignment.description

                // Update DB if any field changed
                if (
                    stateChanged ||
                    dueDateChanged ||
                    titleChanged ||
                    descriptionChanged
                ) {
                    await db
                        .update(classroomAssignment)
                        .set({
                            state: nextState,
                            dueDate: dueDate ?? assignment.dueDate,
                            title: nextTitle,
                            description: nextDescription,
                            updatedAt: new Date(),
                        })
                        .where(eq(classroomAssignment.id, assignment.id))
                }

                return {
                    ...assignment,
                    state: nextState,
                    dueDate: dueDate ?? assignment.dueDate,
                }
            } catch (_error) {
                // If sync fails, return assignment as-is
                return assignment
            }
        }),
    )

    // Return all assignments with synced ones updated
    return assignments.map(assignment => {
        const synced = syncedAssignments.find(s => s.id === assignment.id)
        return synced ?? assignment
    })
}
