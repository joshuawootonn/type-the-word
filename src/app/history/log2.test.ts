import { describe, expect, it } from "vitest"

import { DailyActivityRow } from "~/server/repositories/userDailyActivity.repository"

import { getLogFromCache } from "./log2"

// Helper to create a DailyActivityRow for testing
function createDailyActivity(
    date: Date,
    verseCount: number,
    passages: string[],
): DailyActivityRow {
    return {
        userId: "test-user",
        date,
        verseCount,
        passages,
        averageWpm: null,
        averageAccuracy: null,
        averageCorrectedAccuracy: null,
        versesWithStats: 0,
        updatedAt: new Date(),
    }
}

describe("getLogFromCache", () => {
    describe("empty input", () => {
        it("returns empty array for empty input", () => {
            const result = getLogFromCache([], 0)
            expect(result).toEqual([])
        })
    })

    describe("single day activity", () => {
        it("creates a single month with single day", () => {
            const activity = [
                createDailyActivity(new Date("2024-03-15T00:00:00Z"), 5, [
                    "Genesis 1:1",
                    "Genesis 1:2",
                ]),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result).toHaveLength(1)
            expect(result[0]!.year).toBe(2024)
            expect(result[0]!.month).toBe(2) // March is month 2 (0-indexed)
            expect(result[0]!.numberOfVersesTyped).toBe(5)
            expect(Object.keys(result[0]!.days)).toHaveLength(1)
            expect(result[0]!.days["15"]).toBeDefined()
            expect(result[0]!.days["15"]!.numberOfVersesTyped).toBe(5)
            expect(result[0]!.days["15"]!.location).toEqual([
                "Genesis 1:1",
                "Genesis 1:2",
            ])
        })
    })

    describe("multiple days in same month", () => {
        it("aggregates days under same month", () => {
            const activity = [
                createDailyActivity(new Date("2024-03-15T00:00:00Z"), 3, [
                    "Genesis 1:1",
                ]),
                createDailyActivity(new Date("2024-03-20T00:00:00Z"), 7, [
                    "Exodus 20:3",
                ]),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result).toHaveLength(1)
            expect(result[0]!.numberOfVersesTyped).toBe(10) // 3 + 7
            expect(Object.keys(result[0]!.days)).toHaveLength(2)
            expect(result[0]!.days["15"]!.numberOfVersesTyped).toBe(3)
            expect(result[0]!.days["20"]!.numberOfVersesTyped).toBe(7)
        })
    })

    describe("multiple months", () => {
        it("separates activity by month", () => {
            const activity = [
                createDailyActivity(new Date("2024-03-15T00:00:00Z"), 3, [
                    "Genesis 1:1",
                ]),
                createDailyActivity(new Date("2024-04-10T00:00:00Z"), 5, [
                    "John 3:16",
                ]),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result).toHaveLength(2)
            // Should be sorted descending (April before March)
            expect(result[0]!.month).toBe(3) // April
            expect(result[0]!.numberOfVersesTyped).toBe(5)
            expect(result[1]!.month).toBe(2) // March
            expect(result[1]!.numberOfVersesTyped).toBe(3)
        })

        it("sorts months in descending order", () => {
            const activity = [
                createDailyActivity(new Date("2024-01-01T00:00:00Z"), 1, ["A"]),
                createDailyActivity(new Date("2024-06-15T00:00:00Z"), 2, ["B"]),
                createDailyActivity(new Date("2024-03-10T00:00:00Z"), 3, ["C"]),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result).toHaveLength(3)
            expect(result[0]!.month).toBe(5) // June
            expect(result[1]!.month).toBe(2) // March
            expect(result[2]!.month).toBe(0) // January
        })
    })

    describe("year boundaries", () => {
        it("handles activity across different years", () => {
            const activity = [
                createDailyActivity(new Date("2023-12-31T00:00:00Z"), 2, [
                    "Old year",
                ]),
                createDailyActivity(new Date("2024-01-01T00:00:00Z"), 3, [
                    "New year",
                ]),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result).toHaveLength(2)
            expect(result[0]!.year).toBe(2024)
            expect(result[0]!.month).toBe(0) // January
            expect(result[1]!.year).toBe(2023)
            expect(result[1]!.month).toBe(11) // December
        })
    })

    describe("timezone handling", () => {
        // Note: getLogFromCache now treats dates as calendar dates stored at UTC midnight.
        // The clientTimezoneOffset parameter is no longer used for date shifting.
        // This is intentional - the backfill stores dates based on when the activity
        // was recorded, and we display those dates as-is.

        it("does not shift dates regardless of timezone offset", () => {
            // Activity recorded on March 15 (stored at UTC midnight)
            const activity = [
                createDailyActivity(new Date("2024-03-15T00:00:00Z"), 5, [
                    "Genesis 1:1",
                ]),
            ]

            // Different timezone offsets should not affect the displayed date
            const resultUTCPlus5 = getLogFromCache(activity, -300)
            const resultUTCMinus5 = getLogFromCache(activity, 300)
            const resultUTC = getLogFromCache(activity, 0)

            expect(resultUTCPlus5).toHaveLength(1)
            expect(resultUTCMinus5).toHaveLength(1)
            expect(resultUTC).toHaveLength(1)

            // All should show March 15
            expect(resultUTCPlus5[0]!.days["15"]).toBeDefined()
            expect(resultUTCMinus5[0]!.days["15"]).toBeDefined()
            expect(resultUTC[0]!.days["15"]).toBeDefined()
        })

        it("uses UTC date extraction to avoid local timezone issues", () => {
            // Even if the date object appears to be a different day in local time,
            // we extract using UTC methods so April 1 UTC stays April 1
            const activity = [
                createDailyActivity(new Date("2024-04-01T00:00:00Z"), 5, [
                    "Genesis 1:1",
                ]),
            ]

            const result = getLogFromCache(activity, 300)

            expect(result).toHaveLength(1)
            // Should be April (month 3, 0-indexed) not March
            expect(result[0]!.month).toBe(3) // April
            expect(result[0]!.days["01"]).toBeDefined()
        })
    })

    describe("passages handling", () => {
        it("preserves passage arrays as location", () => {
            const passages = [
                "Genesis 1:1",
                "Genesis 1:2",
                "John 3:16",
                "Romans 8:28",
            ]
            const activity = [
                createDailyActivity(
                    new Date("2024-03-15T00:00:00Z"),
                    4,
                    passages,
                ),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result[0]!.days["15"]!.location).toEqual(passages)
        })

        it("handles empty passages array", () => {
            const activity = [
                createDailyActivity(new Date("2024-03-15T00:00:00Z"), 0, []),
            ]

            const result = getLogFromCache(activity, 0)

            expect(result[0]!.days["15"]!.location).toEqual([])
        })
    })

    describe("large datasets", () => {
        it("handles a full month of activity", () => {
            const activity: DailyActivityRow[] = []
            for (let day = 1; day <= 31; day++) {
                activity.push(
                    createDailyActivity(
                        new Date(
                            `2024-03-${day.toString().padStart(2, "0")}T12:00:00Z`,
                        ),
                        day, // verse count = day number
                        [`Day ${day}`],
                    ),
                )
            }

            const result = getLogFromCache(activity, 0)

            expect(result).toHaveLength(1)
            expect(Object.keys(result[0]!.days)).toHaveLength(31)
            // Total: 1+2+3+...+31 = 496
            expect(result[0]!.numberOfVersesTyped).toBe(496)
        })
    })
})
