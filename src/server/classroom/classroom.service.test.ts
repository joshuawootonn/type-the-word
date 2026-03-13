import { beforeEach, describe, expect, it, vi } from "vitest"

import { getValidStudentToken } from "~/server/classroom/student-token"
import {
    getCourseWork,
    listStudentCourses,
} from "~/server/clients/classroom.client"

import {
    getTeacherToken,
    getStudentCoursePassageAssignmentMatch,
    getStudentPassageAssignmentMatch,
    getStudentToken,
    updateAssignmentFromClassroomSync,
} from "./classroom.repository"
import {
    getPassageAssignmentWarningMatch,
    isAssignmentSyncEligible,
    syncAssignmentsIfEligible,
} from "./classroom.service"

vi.mock("./classroom.repository", () => ({
    getTeacherToken: vi.fn(),
    getStudentToken: vi.fn(),
    getStudentPassageAssignmentMatch: vi.fn(),
    getStudentCoursePassageAssignmentMatch: vi.fn(),
    updateAssignmentFromClassroomSync: vi.fn(),
}))

vi.mock("~/server/classroom/student-token", () => ({
    getValidStudentToken: vi.fn(),
}))

vi.mock("~/server/clients/classroom.client", () => ({
    listStudentCourses: vi.fn(),
    getCourseWork: vi.fn(),
}))

describe("assignment sync policy", () => {
    it("returns false when assignment is older than 3 months", () => {
        const now = new Date("2026-03-12T12:00:00.000Z")
        const eligible = isAssignmentSyncEligible(
            {
                createdAt: new Date("2025-11-30T00:00:00.000Z"),
                lastSyncedAt: null,
            },
            now,
        )

        expect(eligible).toBe(false)
    })

    it("returns false when assignment synced within last 3 minutes", () => {
        const now = new Date("2026-03-12T12:00:00.000Z")
        const eligible = isAssignmentSyncEligible(
            {
                createdAt: new Date("2026-02-01T00:00:00.000Z"),
                lastSyncedAt: new Date("2026-03-12T11:58:30.000Z"),
            },
            now,
        )

        expect(eligible).toBe(false)
    })

    it("returns true for recent assignment with stale sync timestamp", () => {
        const now = new Date("2026-03-12T12:00:00.000Z")
        const eligible = isAssignmentSyncEligible(
            {
                createdAt: new Date("2026-02-01T00:00:00.000Z"),
                lastSyncedAt: new Date("2026-03-12T11:40:00.000Z"),
            },
            now,
        )

        expect(eligible).toBe(true)
    })
})

describe("syncAssignmentsIfEligible", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("syncs eligible assignments and updates lastSyncedAt", async () => {
        const now = new Date("2026-03-12T12:00:00.000Z")
        const assignment = {
            id: "assignment-1",
            courseId: "course-1",
            courseWorkId: "coursework-1",
            title: "Old Title",
            description: "Old Description",
            dueDate: null,
            state: "PUBLISHED" as const,
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
            lastSyncedAt: new Date("2026-03-12T11:00:00.000Z"),
        }
        vi.mocked(getCourseWork).mockResolvedValue({
            id: "coursework-1",
            courseId: "course-1",
            title: "New Title",
            description: "New Description",
            state: "DELETED",
            dueDate: undefined,
            dueTime: undefined,
            alternateLink: "https://classroom.google.com",
        })

        const result = await syncAssignmentsIfEligible(
            "access-token",
            [assignment],
            now,
        )

        expect(result[0]?.title).toBe("New Title")
        expect(result[0]?.state).toBe("DELETED")
        expect(result[0]?.lastSyncedAt).toEqual(now)
        expect(updateAssignmentFromClassroomSync).toHaveBeenCalledWith({
            assignmentId: "assignment-1",
            title: "New Title",
            description: "New Description",
            dueDate: null,
            state: "DELETED",
            lastSyncedAt: now,
        })
    })

    it("skips sync for assignments synced within 3 minutes", async () => {
        const now = new Date("2026-03-12T12:00:00.000Z")
        const assignment = {
            id: "assignment-1",
            courseId: "course-1",
            courseWorkId: "coursework-1",
            title: "Title",
            description: null,
            dueDate: null,
            state: "PUBLISHED" as const,
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
            lastSyncedAt: new Date("2026-03-12T11:59:30.000Z"),
        }

        const result = await syncAssignmentsIfEligible(
            "access-token",
            [assignment],
            now,
        )

        expect(result).toEqual([assignment])
        expect(getCourseWork).not.toHaveBeenCalled()
        expect(updateAssignmentFromClassroomSync).not.toHaveBeenCalled()
    })
})

describe("getPassageAssignmentWarningMatch service", () => {
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

    it("returns synced submission-based match before course lookup", async () => {
        const match = {
            id: "assignment-1",
            courseId: "course-1",
            courseWorkId: "coursework-1",
            title: "John 3",
            description: "Type John 3",
            dueDate: null,
            state: "PUBLISHED" as const,
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
            lastSyncedAt: new Date("2026-03-12T11:00:00.000Z"),
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
        vi.mocked(getValidStudentToken).mockResolvedValue({
            accessToken: "fresh-token",
            googleUserId: "google-1",
        })
        vi.mocked(getCourseWork).mockResolvedValue({
            id: match.courseWorkId,
            courseId: match.courseId,
            title: match.title,
            description: match.description ?? undefined,
            state: "PUBLISHED",
            dueDate: undefined,
            dueTime: undefined,
            alternateLink: "https://classroom.google.com",
        })

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "john",
            chapter: 3,
        })

        expect(result).toMatchObject({
            ...match,
            lastSyncedAt: expect.any(Date),
        })
        expect(result?.lastSyncedAt).toBeInstanceOf(Date)
        expect(getValidStudentToken).toHaveBeenCalledWith("user-1")
        expect(getCourseWork).toHaveBeenCalledWith(
            "fresh-token",
            match.courseId,
            match.courseWorkId,
        )
        expect(listStudentCourses).not.toHaveBeenCalled()
    })

    it("falls back to enrolled-course matching when needed", async () => {
        const match = {
            id: "assignment-2",
            courseId: "course-2",
            courseWorkId: "coursework-2",
            title: "Romans 8",
            description: "Type Romans 8",
            dueDate: null,
            state: "PUBLISHED" as const,
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
            lastSyncedAt: new Date("2026-03-12T11:00:00.000Z"),
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
        vi.mocked(getCourseWork).mockResolvedValue({
            id: match.courseWorkId,
            courseId: match.courseId,
            title: match.title,
            description: match.description ?? undefined,
            state: "PUBLISHED",
            dueDate: undefined,
            dueTime: undefined,
            alternateLink: "https://classroom.google.com",
        })

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
        expect(getCourseWork).toHaveBeenCalledWith(
            "fresh-token",
            match.courseId,
            match.courseWorkId,
        )
        expect(result).toMatchObject({
            ...match,
            lastSyncedAt: expect.any(Date),
        })
        expect(result?.lastSyncedAt).toBeInstanceOf(Date)
    })

    it("returns synced submission match even when no longer published", async () => {
        const submissionMatch = {
            id: "assignment-3",
            courseId: "course-3",
            courseWorkId: "coursework-3",
            title: "Stale Submission Match",
            description: "Type Romans 8",
            dueDate: null,
            state: "PUBLISHED" as const,
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
            lastSyncedAt: new Date("2026-03-12T11:00:00.000Z"),
            translation: "esv" as const,
            book: "romans" as const,
            startChapter: 8,
            startVerse: 1,
            endChapter: 8,
            endVerse: 4,
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
        vi.mocked(getStudentPassageAssignmentMatch).mockResolvedValue(
            submissionMatch,
        )
        vi.mocked(getValidStudentToken).mockResolvedValue({
            accessToken: "fresh-token",
            googleUserId: "google-1",
        })
        vi.mocked(getCourseWork).mockResolvedValueOnce({
            id: submissionMatch.courseWorkId,
            courseId: submissionMatch.courseId,
            title: submissionMatch.title,
            description: submissionMatch.description ?? undefined,
            state: "DELETED",
            dueDate: undefined,
            dueTime: undefined,
            alternateLink: "https://classroom.google.com",
        })

        const result = await getPassageAssignmentWarningMatch({
            userId: "user-1",
            book: "romans",
            chapter: 8,
        })

        expect(listStudentCourses).not.toHaveBeenCalled()
        expect(result).toMatchObject({
            ...submissionMatch,
            state: "DELETED",
            lastSyncedAt: expect.any(Date),
        })
        expect(result?.lastSyncedAt).toBeInstanceOf(Date)
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
