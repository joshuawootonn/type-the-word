import { beforeEach, describe, expect, it, vi } from "vitest"

import { getValidStudentToken } from "~/server/classroom/student-token"
import { listStudentCourses } from "~/server/clients/classroom.client"
import {
    getTeacherToken,
    getStudentCoursePassageAssignmentMatch,
    getStudentPassageAssignmentMatch,
    getStudentToken,
} from "~/server/repositories/classroom.repository"

import { getPassageAssignmentWarningMatch } from "./passage-assignment-warning"

vi.mock("~/server/repositories/classroom.repository", () => ({
    getTeacherToken: vi.fn(),
    getStudentToken: vi.fn(),
    getStudentPassageAssignmentMatch: vi.fn(),
    getStudentCoursePassageAssignmentMatch: vi.fn(),
}))

vi.mock("~/server/classroom/student-token", () => ({
    getValidStudentToken: vi.fn(),
}))

vi.mock("~/server/clients/classroom.client", () => ({
    listStudentCourses: vi.fn(),
}))

describe("getPassageAssignmentWarningMatch", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("returns undefined when user has no classroom tokens", async () => {
        vi.mocked(getTeacherToken).mockResolvedValue(undefined)
        vi.mocked(getStudentToken).mockResolvedValue(undefined)

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "john",
            chapter: 3,
        })

        expect(result).toBeUndefined()
        expect(getStudentPassageAssignmentMatch).not.toHaveBeenCalled()
        expect(getValidStudentToken).not.toHaveBeenCalled()
    })

    it("returns undefined when user only has a teacher token", async () => {
        vi.mocked(getTeacherToken).mockResolvedValue({
            userId: "user-1",
            accessToken: "token",
            refreshToken: "refresh",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
            scope: "scope",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        vi.mocked(getStudentToken).mockResolvedValue(undefined)

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "john",
            chapter: 3,
        })

        expect(result).toBeUndefined()
        expect(getStudentPassageAssignmentMatch).not.toHaveBeenCalled()
        expect(getValidStudentToken).not.toHaveBeenCalled()
    })

    it("returns submission-based match before course lookup", async () => {
        const match = {
            id: "assignment-1",
            courseId: "course-1",
            title: "John 3",
            translation: "esv" as const,
            book: "john" as const,
            startChapter: 3,
            startVerse: 1,
            endChapter: 3,
            endVerse: 21,
        }

        vi.mocked(getStudentToken).mockResolvedValue({
            userId: "user-1",
            googleUserId: "google-1",
            accessToken: "token",
            refreshToken: "refresh",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
            scope: "scope",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        vi.mocked(getTeacherToken).mockResolvedValue(undefined)
        vi.mocked(getStudentPassageAssignmentMatch).mockResolvedValue(match)

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "john",
            chapter: 3,
        })

        expect(result).toEqual(match)
        expect(getValidStudentToken).not.toHaveBeenCalled()
        expect(listStudentCourses).not.toHaveBeenCalled()
    })

    it("falls back to enrolled-course matching when needed", async () => {
        const match = {
            id: "assignment-2",
            courseId: "course-2",
            title: "Romans 8",
            translation: "esv" as const,
            book: "romans" as const,
            startChapter: 8,
            startVerse: 1,
            endChapter: 8,
            endVerse: 11,
        }

        vi.mocked(getStudentToken).mockResolvedValue({
            userId: "user-1",
            googleUserId: "google-1",
            accessToken: "token",
            refreshToken: "refresh",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
            scope: "scope",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        vi.mocked(getTeacherToken).mockResolvedValue(undefined)
        vi.mocked(getStudentPassageAssignmentMatch).mockResolvedValue(undefined)
        vi.mocked(getValidStudentToken).mockResolvedValue({
            accessToken: "fresh-token",
            googleUserId: "google-1",
        })
        vi.mocked(listStudentCourses).mockResolvedValue([
            { id: "course-2", name: "Course 2" },
        ])
        vi.mocked(getStudentCoursePassageAssignmentMatch).mockResolvedValue(
            match,
        )

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "romans",
            chapter: 8,
        })

        expect(getStudentCoursePassageAssignmentMatch).toHaveBeenCalledWith({
            studentUserId: "user-1",
            courseIds: ["course-2"],
            book: "romans",
            chapter: 8,
        })
        expect(result).toEqual(match)
    })

    it("returns undefined when course lookup fails", async () => {
        vi.mocked(getStudentToken).mockResolvedValue({
            userId: "user-1",
            googleUserId: "google-1",
            accessToken: "token",
            refreshToken: "refresh",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
            scope: "scope",
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        vi.mocked(getTeacherToken).mockResolvedValue(undefined)
        vi.mocked(getStudentPassageAssignmentMatch).mockResolvedValue(undefined)
        vi.mocked(getValidStudentToken).mockResolvedValue({
            accessToken: "fresh-token",
            googleUserId: "google-1",
        })
        vi.mocked(listStudentCourses).mockRejectedValue(
            new Error("classroom down"),
        )

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "romans",
            chapter: 8,
        })

        expect(result).toBeUndefined()
    })
})
