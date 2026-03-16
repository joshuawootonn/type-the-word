import { describe, expect, it } from "vitest"

import {
    shouldSchedulePassageAutoSync,
    toPassageSelectorTargetKey,
} from "./passageSelector-auto-sync"

describe("passageSelector auto-sync scheduling", () => {
    it("does not schedule when explicit submit already targeted same selection", () => {
        const key = toPassageSelectorTargetKey("romans", "8", "nkjv")
        const shouldSchedule = shouldSchedulePassageAutoSync({
            pathname: "/passage/romans_7",
            book: "romans",
            chapter: "8",
            translation: "nkjv",
            lastSubmittedTargetKey: key,
        })

        expect(shouldSchedule).toBe(false)
    })

    it("schedules for unsynced chapter when there was no explicit submit", () => {
        const shouldSchedule = shouldSchedulePassageAutoSync({
            pathname: "/passage/romans_7",
            book: "romans",
            chapter: "8",
            translation: "nkjv",
            lastSubmittedTargetKey: null,
        })

        expect(shouldSchedule).toBe(true)
    })

    it("does not schedule when subsection path is already in sync", () => {
        const shouldSchedule = shouldSchedulePassageAutoSync({
            pathname: "/passage/romans_8:38-39",
            book: "romans",
            chapter: "8",
            translation: "nkjv",
            lastSubmittedTargetKey: null,
        })

        expect(shouldSchedule).toBe(false)
    })
})
