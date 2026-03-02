import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as classroomClient from "~/server/clients/classroom.client"
import * as classroomRepository from "~/server/repositories/classroom.repository"
import * as organizationRepository from "~/server/repositories/organization.repository"

const cookieStoreMock = {
    set: vi.fn(),
    delete: vi.fn(),
}

const dbSelectLimitMock = vi.fn()
const dbSelectWhereMock = vi.fn(() => ({ limit: dbSelectLimitMock }))
const dbSelectFromMock = vi.fn(() => ({ where: dbSelectWhereMock }))

vi.mock("next/headers", () => ({
    cookies: vi.fn(async () => cookieStoreMock),
}))

vi.mock("~/server/db", () => ({
    db: {
        select: vi.fn(() => ({
            from: dbSelectFromMock,
        })),
    },
}))

vi.mock("~/server/clients/classroom.client", () => ({
    exchangeCodeForTokens: vi.fn(),
    listCourses: vi.fn(),
}))

vi.mock("~/server/repositories/classroom.repository", () => ({
    saveTeacherToken: vi.fn(),
}))

vi.mock("~/server/repositories/organization.repository", () => ({
    getDomainFromEmail: vi.fn(),
    ensureTeacherMembershipOnConnect: vi.fn(),
    syncTeacherCourseMappings: vi.fn(),
}))

import { GET } from "./route"

describe("GET /api/classroom/callback", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dbSelectLimitMock.mockResolvedValue([
            { id: "user-1", email: "teacher@example.com", name: "Teacher" },
        ])
        vi.mocked(classroomClient.exchangeCodeForTokens).mockResolvedValue({
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresAt: new Date(Date.now() + 60_000),
            scope: "scope",
        })
        vi.mocked(classroomClient.listCourses).mockResolvedValue([
            {
                id: "course-1",
                name: "Course 1",
            },
        ] as never)
        vi.mocked(organizationRepository.getDomainFromEmail).mockReturnValue(
            "example.com",
        )
    })

    it("redirects to pending when teacher needs approval", async () => {
        vi.mocked(
            organizationRepository.ensureTeacherMembershipOnConnect,
        ).mockResolvedValue({
            organization: { id: "org-1", domain: "example.com" },
            membership: { status: "PENDING" },
            needsApproval: true,
            isFirstTeacher: false,
        } as never)

        const request = new NextRequest(
            "http://localhost/api/classroom/callback?code=abc&state=user-1",
        )
        const response = await GET(request)

        expect(classroomRepository.saveTeacherToken).toHaveBeenCalledOnce()
        expect(
            organizationRepository.syncTeacherCourseMappings,
        ).toHaveBeenCalledWith({
            organizationId: "org-1",
            teacherUserId: "user-1",
            courseIds: ["course-1"],
        })
        expect(cookieStoreMock.delete).toHaveBeenCalledWith("classroomTeacher")
        expect(response.headers.get("location")).toContain(
            "/classroom?pending_teacher=true",
        )
    })

    it("redirects to success when teacher is approved", async () => {
        vi.mocked(
            organizationRepository.ensureTeacherMembershipOnConnect,
        ).mockResolvedValue({
            organization: { id: "org-1", domain: "example.com" },
            membership: { status: "APPROVED" },
            needsApproval: false,
            isFirstTeacher: true,
        } as never)

        const request = new NextRequest(
            "http://localhost/api/classroom/callback?code=abc&state=user-1",
        )
        const response = await GET(request)

        expect(cookieStoreMock.set).toHaveBeenCalledWith(
            "classroomTeacher",
            "true",
            expect.any(Object),
        )
        expect(response.headers.get("location")).toContain(
            "/classroom?success=true",
        )
    })
})
