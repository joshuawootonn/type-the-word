import { NextRequest } from "next/server"
import { beforeEach, describe, expect, test, vi } from "vitest"

import * as classroomClient from "~/server/clients/classroom.client"
import * as classroomRepository from "~/server/repositories/classroom.repository"

// Mock next-auth
vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}))

// Mock classroom client
vi.mock("~/server/clients/classroom.client", () => ({
    createCourseWork: vi.fn(),
    refreshAccessToken: vi.fn(),
}))

// Mock classroom repository
vi.mock("~/server/repositories/classroom.repository", () => ({
    getTeacherToken: vi.fn(),
    updateTeacherTokenAccess: vi.fn(),
    createAssignment: vi.fn(),
}))

import { getServerSession } from "next-auth"

import { POST } from "./route"

describe("POST /api/classroom/assignments", () => {
    const mockSession = {
        user: { id: "user-123", name: "Teacher", email: "teacher@example.com" },
    }

    const mockToken = {
        userId: "user-123",
        accessToken: "valid-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        scope: "classroom.scope",
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const validRequest = {
        courseId: "course-123",
        title: "Type Genesis 1:1-5 (ESV)",
        translation: "esv",
        book: "genesis",
        startChapter: 1,
        startVerse: 1,
        endChapter: 1,
        endVerse: 5,
        maxPoints: 100,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("WHEN not authenticated THEN returns 401", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(validRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe("Unauthorized")
    })

    test("WHEN classroom not connected THEN returns 403", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue(
            undefined,
        )

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(validRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe("Google Classroom not connected")
    })

    test("WHEN end verse before start verse THEN returns 400", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue(
            mockToken,
        )

        const invalidRequest = {
            ...validRequest,
            startVerse: 10,
            endVerse: 5,
        }

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(invalidRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain("must be after or equal to")
    })

    test("WHEN end chapter before start chapter THEN returns 400", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue(
            mockToken,
        )

        const invalidRequest = {
            ...validRequest,
            startChapter: 5,
            endChapter: 3,
        }

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(invalidRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain("must be after or equal to")
    })

    test("WHEN verse exceeds chapter length THEN returns 400", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue(
            mockToken,
        )

        const invalidRequest = {
            ...validRequest,
            startVerse: 500, // Genesis 1 has 31 verses
        }

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(invalidRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain("does not exist")
    })

    test("WHEN chapter exceeds book length THEN returns 400", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue(
            mockToken,
        )

        const invalidRequest = {
            ...validRequest,
            book: "jude",
            startChapter: 2, // Jude only has 1 chapter
            endChapter: 2,
        }

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(invalidRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain("does not exist")
    })

    test("WHEN valid request THEN creates assignment successfully", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue(
            mockToken,
        )
        vi.mocked(classroomClient.createCourseWork).mockResolvedValue({
            id: "coursework-123",
            courseId: "course-123",
            title: "Type Genesis 1:1-5 (ESV)",
            alternateLink: "https://classroom.google.com/c/abc/a/xyz",
            maxPoints: 100,
        })
        vi.mocked(classroomRepository.createAssignment).mockResolvedValue({
            id: "assignment-123",
            teacherUserId: "user-123",
            courseId: "course-123",
            courseWorkId: "coursework-123",
            title: "Type Genesis 1:1-5 (ESV)",
            description: null,
            translation: "esv",
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 5,
            maxPoints: 100,
            dueDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(validRequest),
            },
        )

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.assignmentId).toBe("assignment-123")
        expect(data.courseWorkId).toBe("coursework-123")
        expect(data.courseWorkLink).toBe(
            "https://classroom.google.com/c/abc/a/xyz",
        )
    })

    test("WHEN token expired THEN refreshes and creates assignment", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession)
        vi.mocked(classroomRepository.getTeacherToken).mockResolvedValue({
            ...mockToken,
            expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        })
        vi.mocked(classroomClient.refreshAccessToken).mockResolvedValue({
            accessToken: "new-token",
            expiresAt: new Date(Date.now() + 3600 * 1000),
        })
        vi.mocked(classroomClient.createCourseWork).mockResolvedValue({
            id: "coursework-123",
            courseId: "course-123",
            title: "Type Genesis 1:1-5 (ESV)",
            maxPoints: 100,
        })
        vi.mocked(classroomRepository.createAssignment).mockResolvedValue({
            id: "assignment-123",
            teacherUserId: "user-123",
            courseId: "course-123",
            courseWorkId: "coursework-123",
            title: "Type Genesis 1:1-5 (ESV)",
            description: null,
            translation: "esv",
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 5,
            maxPoints: 100,
            dueDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const request = new NextRequest(
            "http://localhost/api/classroom/assignments",
            {
                method: "POST",
                body: JSON.stringify(validRequest),
            },
        )

        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(classroomClient.refreshAccessToken).toHaveBeenCalledWith(
            "refresh-token",
        )
        expect(classroomRepository.updateTeacherTokenAccess).toHaveBeenCalled()
    })
})
