import { afterEach, describe, expect, it } from "vitest"

import {
    getClassroomClient,
    resetClassroomClientForTests,
    resolveClassroomClientMode,
} from "./resolver"

const originalE2EMockClassroom = process.env.E2E_MOCK_CLASSROOM

describe("classroom client resolver", () => {
    afterEach(() => {
        process.env.E2E_MOCK_CLASSROOM = originalE2EMockClassroom
        resetClassroomClientForTests()
    })

    it("selects e2e mock mode when flag is enabled", () => {
        expect(resolveClassroomClientMode("1")).toBe("e2e-mock")
    })

    it("selects google mode when flag is absent", () => {
        expect(resolveClassroomClientMode(undefined)).toBe("google")
    })

    it("returns e2e mock client from cached resolver", () => {
        process.env.E2E_MOCK_CLASSROOM = "1"
        const client = getClassroomClient()
        const authUrl = client.getAuthUrl("user-123")

        expect(authUrl).toContain("/api/classroom/callback")
        expect(authUrl).toContain("code=e2e-teacher-code")
        expect(authUrl).toContain("state=user-123")
    })

    it("returns google client from cached resolver", () => {
        delete process.env.E2E_MOCK_CLASSROOM
        const client = getClassroomClient()
        const authUrl = client.getAuthUrl("user-123")

        expect(authUrl).toContain("accounts.google.com")
        expect(authUrl).toContain("state=user-123")
    })
})
