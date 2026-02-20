import { describe, expect, it } from "vitest"

import {
    createClassroomTypedVerseWhere,
    getPreviousDayWindowInTimeZone,
    isCronRequestAuthorized,
    toSqlString,
} from "./utils"

describe("discord analytics cron utils", () => {
    describe("isCronRequestAuthorized", () => {
        it("returns true when bearer token matches CRON_SECRET", () => {
            const isAuthorized = isCronRequestAuthorized(
                "Bearer super-secret",
                "super-secret",
            )

            expect(isAuthorized).toBe(true)
        })

        it("returns false when CRON_SECRET is missing", () => {
            const isAuthorized = isCronRequestAuthorized(
                "Bearer super-secret",
                undefined,
            )

            expect(isAuthorized).toBe(false)
        })

        it("returns false when bearer token does not match", () => {
            const isAuthorized = isCronRequestAuthorized(
                "Bearer wrong-secret",
                "super-secret",
            )

            expect(isAuthorized).toBe(false)
        })
    })

    describe("getPreviousDayWindowInTimeZone", () => {
        it("builds a previous-day window that handles spring DST transition", () => {
            const now = new Date("2026-03-09T12:00:00.000Z")
            const window = getPreviousDayWindowInTimeZone(
                now,
                "America/Chicago",
            )

            expect(window.label).toBe("2026-03-08")
            expect(window.start.toISOString()).toBe("2026-03-08T06:00:00.000Z")
            expect(window.end.toISOString()).toBe("2026-03-09T05:00:00.000Z")
        })

        it("builds a previous-day window that handles fall DST transition", () => {
            const now = new Date("2026-11-02T12:00:00.000Z")
            const window = getPreviousDayWindowInTimeZone(
                now,
                "America/Chicago",
            )

            expect(window.label).toBe("2026-11-01")
            expect(window.start.toISOString()).toBe("2026-11-01T05:00:00.000Z")
            expect(window.end.toISOString()).toBe("2026-11-02T06:00:00.000Z")
        })
    })

    describe("createClassroomTypedVerseWhere", () => {
        it("includes classroomAssignmentId IS NOT NULL in SQL", () => {
            const window = {
                label: "2026-02-19",
                start: new Date("2026-02-19T06:00:00.000Z"),
                end: new Date("2026-02-20T06:00:00.000Z"),
            }

            const sqlString = toSqlString(
                createClassroomTypedVerseWhere(window),
            )
            const normalizedSql = sqlString.toLowerCase()

            expect(normalizedSql).toContain(
                '"typedverse"."classroomassignmentid" is not null',
            )
            expect(normalizedSql).toContain('"typedverse"."createdat"')
        })
    })
})
