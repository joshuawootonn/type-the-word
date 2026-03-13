import { NextRequest } from "next/server"
import { beforeEach, describe, expect, test, vi } from "vitest"

// Mock next-auth
vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}))

vi.mock("~/server/auth", () => ({
    authOptions: {},
}))

vi.mock("~/server/repositories/organization.repository", () => ({
    getApprovedOrganizationForUser: vi.fn(),
    getOrganizationSettingsByOrganizationIdOrThrow: vi.fn(),
    isUserApprovedOrganizationTeacher: vi.fn(),
    updateOrganizationSettings: vi.fn(),
}))

import { getServerSession } from "next-auth"

import * as organizationRepository from "~/server/repositories/organization.repository"

import { GET, PUT } from "./route"

describe("Organization settings route", () => {
    const mockSession = {
        user: {
            id: "user-1",
            email: "teacher@example.com",
            name: "Teacher",
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("GET returns 401 when unauthenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe("Unauthorized")
    })

    test("GET returns 403 when user has no approved org", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(
            organizationRepository.getApprovedOrganizationForUser,
        ).mockResolvedValue(undefined)

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe("No approved organization membership")
    })

    test("GET returns organization settings payload", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(
            organizationRepository.getApprovedOrganizationForUser,
        ).mockResolvedValue({
            id: "org-1",
            domain: "example.edu",
        } as never)
        vi.mocked(
            organizationRepository.isUserApprovedOrganizationTeacher,
        ).mockResolvedValue(true)
        vi.mocked(
            organizationRepository.getOrganizationSettingsByOrganizationIdOrThrow,
        ).mockResolvedValue({
            organizationId: "org-1",
            accuracyThreshold: 88,
            regularAccuracyThreshold: 20,
        } as never)

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual({
            organizationId: "org-1",
            accuracyThreshold: 88,
            regularAccuracyThreshold: 20,
            isOrgTeacher: true,
        })
    })

    test("GET bubbles when settings are missing", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(
            organizationRepository.getApprovedOrganizationForUser,
        ).mockResolvedValue({
            id: "org-1",
            domain: "example.edu",
        } as never)
        vi.mocked(
            organizationRepository.isUserApprovedOrganizationTeacher,
        ).mockResolvedValue(false)
        vi.mocked(
            organizationRepository.getOrganizationSettingsByOrganizationIdOrThrow,
        ).mockRejectedValue(
            new Error(
                "Organization settings are missing for organization org-1",
            ),
        )

        await expect(GET()).rejects.toThrow(
            "Organization settings are missing for organization org-1",
        )
    })

    test("PUT returns 401 when unauthenticated", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const request = new NextRequest(
            "http://localhost/api/classroom/organization/settings",
            {
                method: "PUT",
                body: JSON.stringify({
                    accuracyThreshold: 80,
                    regularAccuracyThreshold: 20,
                }),
            },
        )

        const response = await PUT(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe("Unauthorized")
    })

    test("PUT returns 403 when user is not org teacher", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(
            organizationRepository.getApprovedOrganizationForUser,
        ).mockResolvedValue({
            id: "org-1",
            domain: "example.edu",
        } as never)
        vi.mocked(
            organizationRepository.isUserApprovedOrganizationTeacher,
        ).mockResolvedValue(false)

        const request = new NextRequest(
            "http://localhost/api/classroom/organization/settings",
            {
                method: "PUT",
                body: JSON.stringify({
                    accuracyThreshold: 80,
                    regularAccuracyThreshold: 20,
                }),
            },
        )

        const response = await PUT(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe("Forbidden")
    })

    test("PUT returns 400 for invalid threshold payload", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(
            organizationRepository.getApprovedOrganizationForUser,
        ).mockResolvedValue({
            id: "org-1",
            domain: "example.edu",
        } as never)
        vi.mocked(
            organizationRepository.isUserApprovedOrganizationTeacher,
        ).mockResolvedValue(true)

        const request = new NextRequest(
            "http://localhost/api/classroom/organization/settings",
            {
                method: "PUT",
                body: JSON.stringify({
                    accuracyThreshold: 101,
                    regularAccuracyThreshold: 20,
                }),
            },
        )

        const response = await PUT(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain("Number must be less than or equal to 100")
    })

    test("PUT updates settings and returns latest value", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(
            organizationRepository.getApprovedOrganizationForUser,
        ).mockResolvedValue({
            id: "org-1",
            domain: "example.edu",
        } as never)
        vi.mocked(
            organizationRepository.isUserApprovedOrganizationTeacher,
        ).mockResolvedValue(true)
        vi.mocked(
            organizationRepository.updateOrganizationSettings,
        ).mockResolvedValue({
            organizationId: "org-1",
            accuracyThreshold: 92,
            regularAccuracyThreshold: 33,
        } as never)

        const request = new NextRequest(
            "http://localhost/api/classroom/organization/settings",
            {
                method: "PUT",
                body: JSON.stringify({
                    accuracyThreshold: 92,
                    regularAccuracyThreshold: 33,
                }),
            },
        )

        const response = await PUT(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(
            organizationRepository.updateOrganizationSettings,
        ).toHaveBeenCalledWith({
            organizationId: "org-1",
            accuracyThreshold: 92,
            regularAccuracyThreshold: 33,
        })
        expect(data).toEqual({
            organizationId: "org-1",
            accuracyThreshold: 92,
            regularAccuracyThreshold: 33,
            isOrgTeacher: true,
        })
    })
})
