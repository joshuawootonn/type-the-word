import { describe, expect, it } from "vitest"

import { shouldAutoSyncPassagePath } from "./passageSelector-path-sync"

describe("shouldAutoSyncPassagePath", () => {
    it("does not auto-sync on root path", () => {
        expect(shouldAutoSyncPassagePath("/", "romans", "8")).toBe(false)
    })

    it("does not auto-sync when chapter subsection is already selected", () => {
        expect(
            shouldAutoSyncPassagePath("/passage/romans_8:38-39", "romans", "8"),
        ).toBe(false)
    })

    it("auto-syncs when current passage is a different chapter", () => {
        expect(
            shouldAutoSyncPassagePath("/passage/romans_7", "romans", "8"),
        ).toBe(true)
    })
})
