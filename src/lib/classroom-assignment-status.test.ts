import { describe, expect, it } from "vitest"

import { getStudentAssignmentDisplayStatus } from "./classroom-assignment-status"

describe("getStudentAssignmentDisplayStatus", () => {
    const now = new Date("2026-02-23T12:00:00.000Z")

    it("returns completed when assignment is completed", () => {
        const status = getStudentAssignmentDisplayStatus({
            dueDate: "2026-02-01T00:00:00.000Z",
            isCompleted: 1,
            now,
        })

        expect(status).toBe("completed")
    })

    it("returns pastDue when assignment is incomplete and due date is past", () => {
        const status = getStudentAssignmentDisplayStatus({
            dueDate: "2026-02-20T00:00:00.000Z",
            isCompleted: 0,
            now,
        })

        expect(status).toBe("pastDue")
    })

    it("returns current when assignment is incomplete and due date is current/future", () => {
        const status = getStudentAssignmentDisplayStatus({
            dueDate: "2026-02-25T00:00:00.000Z",
            isCompleted: 0,
            now,
        })

        expect(status).toBe("current")
    })

    it("returns noDueDate when assignment is incomplete with no due date", () => {
        const status = getStudentAssignmentDisplayStatus({
            dueDate: null,
            isCompleted: 0,
            now,
        })

        expect(status).toBe("noDueDate")
    })
})
