import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { db } from "~/server/db"
import {
    classroomAssignment,
    classroomSubmission,
    classroomTeacherToken,
    users,
} from "~/server/db/schema"

import {
    createAssignment,
    deleteTeacherToken,
    getAssignment,
    getAssignmentByTeacher,
    getOrCreateSubmission,
    getSubmissionByStudent,
    getSubmissionsByAssignment,
    getTeacherToken,
    markSubmissionTurnedIn,
    saveTeacherToken,
    updateAssignmentState,
    updateSubmissionProgress,
    updateTeacherTokenAccess,
} from "./classroom.repository"

describe("ClassroomRepository - Integration Tests", () => {
    let testTeacherId: string
    let testStudentId: string

    beforeEach(async () => {
        // Create test users
        testTeacherId = crypto.randomUUID()
        testStudentId = crypto.randomUUID()

        await db.insert(users).values([
            {
                id: testTeacherId,
                email: `teacher-${testTeacherId}@example.com`,
                name: "Test Teacher",
            },
            {
                id: testStudentId,
                email: `student-${testStudentId}@example.com`,
                name: "Test Student",
            },
        ])
    })

    afterEach(async () => {
        // Clean up in correct order (foreign key constraints)
        await db
            .delete(classroomSubmission)
            .where(eq(classroomSubmission.studentUserId, testStudentId))
        await db
            .delete(classroomAssignment)
            .where(eq(classroomAssignment.teacherUserId, testTeacherId))
        await db
            .delete(classroomTeacherToken)
            .where(eq(classroomTeacherToken.userId, testTeacherId))
        await db.delete(users).where(eq(users.id, testTeacherId))
        await db.delete(users).where(eq(users.id, testStudentId))
    })

    describe("Teacher Token Operations", () => {
        it("saves and retrieves teacher token", async () => {
            const tokenData = {
                userId: testTeacherId,
                accessToken: "test-access-token",
                refreshToken: "test-refresh-token",
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "classroom.scope",
            }

            await saveTeacherToken(tokenData)

            const retrieved = await getTeacherToken(testTeacherId)

            expect(retrieved).not.toBeNull()
            expect(retrieved?.userId).toBe(testTeacherId)
            expect(retrieved?.accessToken).toBe("test-access-token")
            expect(retrieved?.refreshToken).toBe("test-refresh-token")
        })

        it("returns null when no token exists", async () => {
            const result = await getTeacherToken(testTeacherId)

            expect(result).toBeUndefined()
        })

        it("updates existing token on conflict", async () => {
            await saveTeacherToken({
                userId: testTeacherId,
                accessToken: "old-token",
                refreshToken: "old-refresh",
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "old.scope",
            })

            await saveTeacherToken({
                userId: testTeacherId,
                accessToken: "new-token",
                refreshToken: "new-refresh",
                expiresAt: new Date(Date.now() + 7200 * 1000),
                scope: "new.scope",
            })

            const retrieved = await getTeacherToken(testTeacherId)

            expect(retrieved?.accessToken).toBe("new-token")
            expect(retrieved?.refreshToken).toBe("new-refresh")
        })

        it("updates only access token and expiry", async () => {
            const originalRefreshToken = "original-refresh"
            await saveTeacherToken({
                userId: testTeacherId,
                accessToken: "old-access",
                refreshToken: originalRefreshToken,
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "test.scope",
            })

            const newExpiresAt = new Date(Date.now() + 7200 * 1000)
            await updateTeacherTokenAccess(
                testTeacherId,
                "new-access",
                newExpiresAt,
            )

            const retrieved = await getTeacherToken(testTeacherId)

            expect(retrieved?.accessToken).toBe("new-access")
            expect(retrieved?.refreshToken).toBe(originalRefreshToken)
            expect(retrieved?.expiresAt.getTime()).toBe(newExpiresAt.getTime())
        })

        it("deletes teacher token", async () => {
            await saveTeacherToken({
                userId: testTeacherId,
                accessToken: "test-token",
                refreshToken: "test-refresh",
                expiresAt: new Date(Date.now() + 3600 * 1000),
                scope: "test.scope",
            })

            await deleteTeacherToken(testTeacherId)

            const retrieved = await getTeacherToken(testTeacherId)
            expect(retrieved).toBeUndefined()
        })
    })

    describe("Assignment Operations", () => {
        it("creates and retrieves assignment", async () => {
            const assignmentData = {
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Type Genesis 1:1-5",
                description: "Test assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
            }

            const created = await createAssignment(assignmentData)

            expect(created.id).toBeDefined()
            expect(created.title).toBe("Type Genesis 1:1-5")
            expect(created.state).toBe("DRAFT") // Default state

            const retrieved = await getAssignment(created.id)

            expect(retrieved).not.toBeNull()
            expect(retrieved?.id).toBe(created.id)
            expect(retrieved?.totalVerses).toBe(5)
        })

        it("creates assignment with custom state", async () => {
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Published Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
                state: "PUBLISHED",
            })

            expect(assignment.state).toBe("PUBLISHED")
        })

        it("retrieves assignments by teacher", async () => {
            await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-1",
                title: "Assignment 1",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
            })

            await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-2",
                title: "Assignment 2",
                translation: "esv" as const,
                book: "exodus" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 10,
                totalVerses: 10,
                maxPoints: 100,
            })

            const assignments = await getAssignmentByTeacher(testTeacherId)

            expect(assignments).toHaveLength(2)
        })

        it("filters assignments by course", async () => {
            await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-1",
                title: "Course 123 Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
            })

            await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-456",
                courseWorkId: "coursework-2",
                title: "Course 456 Assignment",
                translation: "esv" as const,
                book: "exodus" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 10,
                totalVerses: 10,
                maxPoints: 100,
            })

            const course123Assignments = await getAssignmentByTeacher(
                testTeacherId,
                "course-123",
            )

            expect(course123Assignments).toHaveLength(1)
            expect(course123Assignments[0]?.title).toBe("Course 123 Assignment")
        })

        it("updates assignment state", async () => {
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Draft Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
            })

            expect(assignment.state).toBe("DRAFT")

            await updateAssignmentState(assignment.id, "PUBLISHED")

            const updated = await getAssignment(assignment.id)
            expect(updated?.state).toBe("PUBLISHED")
        })

        it("returns null for non-existent assignment", async () => {
            const result = await getAssignment(crypto.randomUUID())

            expect(result).toBeUndefined()
        })
    })

    describe("Submission Operations", () => {
        let testAssignmentId: string

        beforeEach(async () => {
            // Create a test assignment
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Test Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 31,
                totalVerses: 31,
                maxPoints: 100,
            })
            testAssignmentId = assignment.id
        })

        it("creates new submission", async () => {
            const submission = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            expect(submission.id).toBeDefined()
            expect(submission.assignmentId).toBe(testAssignmentId)
            expect(submission.studentUserId).toBe(testStudentId)
            expect(submission.totalVerses).toBe(31)
            expect(submission.completedVerses).toBe(0)
            expect(submission.startedAt).toBeDefined()
        })

        it("returns existing submission instead of creating duplicate", async () => {
            const first = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            const second = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            expect(first.id).toBe(second.id)
        })

        it("updates submission progress", async () => {
            const submission = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            await updateSubmissionProgress(submission.id, {
                completedVerses: 15,
                averageWpm: 45,
                averageAccuracy: 95,
            })

            const updated = await getSubmissionByStudent(
                testAssignmentId,
                testStudentId,
            )

            expect(updated?.completedVerses).toBe(15)
            expect(updated?.averageWpm).toBe(45)
            expect(updated?.averageAccuracy).toBe(95)
        })

        it("marks submission as completed when isCompleted is true", async () => {
            const submission = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            await updateSubmissionProgress(submission.id, {
                completedVerses: 31,
                isCompleted: true,
            })

            const updated = await getSubmissionByStudent(
                testAssignmentId,
                testStudentId,
            )

            expect(updated?.isCompleted).toBe(1)
            expect(updated?.completedAt).toBeDefined()
        })

        it("marks submission as turned in", async () => {
            const submission = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            await markSubmissionTurnedIn(submission.id)

            const updated = await getSubmissionByStudent(
                testAssignmentId,
                testStudentId,
            )

            expect(updated?.isTurnedIn).toBe(1)
            expect(updated?.turnedInAt).toBeDefined()
        })

        it("retrieves all submissions for assignment", async () => {
            const student2Id = crypto.randomUUID()
            await db.insert(users).values({
                id: student2Id,
                email: `student-${student2Id}@example.com`,
                name: "Test Student 2",
            })

            await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: student2Id,
                totalVerses: 31,
            })

            const submissions =
                await getSubmissionsByAssignment(testAssignmentId)

            expect(submissions).toHaveLength(2)
            expect(submissions[0]?.student).toBeDefined()
            expect(submissions[0]?.student.email).toBeDefined()

            // Cleanup
            await db
                .delete(classroomSubmission)
                .where(eq(classroomSubmission.studentUserId, student2Id))
            await db.delete(users).where(eq(users.id, student2Id))
        })

        it("returns null for non-existent submission", async () => {
            const result = await getSubmissionByStudent(
                testAssignmentId,
                crypto.randomUUID(),
            )

            expect(result).toBeUndefined()
        })

        it("prevents duplicate submissions for same student and assignment", async () => {
            await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            // Try to create another submission for same student/assignment
            // Should return existing instead of creating new
            const second = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
            })

            const allSubmissions =
                await getSubmissionsByAssignment(testAssignmentId)

            // Should only be 1 submission
            expect(allSubmissions).toHaveLength(1)
            expect(second.id).toBe(allSubmissions[0]?.id)
        })
    })

    describe("Assignment State Validation", () => {
        it("creates assignment with DRAFT state by default", async () => {
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Test Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
            })

            expect(assignment.state).toBe("DRAFT")
        })

        it("updates assignment from DRAFT to PUBLISHED", async () => {
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Test Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
            })

            await updateAssignmentState(assignment.id, "PUBLISHED")

            const updated = await getAssignment(assignment.id)
            expect(updated?.state).toBe("PUBLISHED")
        })

        it("updates assignment from PUBLISHED to DELETED", async () => {
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Test Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 5,
                totalVerses: 5,
                maxPoints: 100,
                state: "PUBLISHED",
            })

            await updateAssignmentState(assignment.id, "DELETED")

            const updated = await getAssignment(assignment.id)
            expect(updated?.state).toBe("DELETED")
        })
    })

    describe("Data Integrity", () => {
        let testAssignmentId: string

        beforeEach(async () => {
            // Create a test assignment for this describe block
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Data Integrity Test Assignment",
                translation: "esv" as const,
                book: "genesis" as const,
                startChapter: 1,
                startVerse: 1,
                endChapter: 1,
                endVerse: 31,
                totalVerses: 31,
                maxPoints: 100,
            })
            testAssignmentId = assignment.id
        })

        it("stores and retrieves all assignment fields correctly", async () => {
            const dueDate = new Date("2024-12-31T23:59:00Z")
            const assignment = await createAssignment({
                teacherUserId: testTeacherId,
                courseId: "course-123",
                courseWorkId: "coursework-456",
                title: "Complete Assignment",
                description: "Full description",
                translation: "niv" as const,
                book: "psalm" as const,
                startChapter: 23,
                startVerse: 1,
                endChapter: 23,
                endVerse: 6,
                totalVerses: 6,
                maxPoints: 150,
                dueDate,
                state: "PUBLISHED",
            })

            const retrieved = await getAssignment(assignment.id)

            expect(retrieved?.title).toBe("Complete Assignment")
            expect(retrieved?.description).toBe("Full description")
            expect(retrieved?.translation).toBe("niv")
            expect(retrieved?.book).toBe("psalm")
            expect(retrieved?.startChapter).toBe(23)
            expect(retrieved?.startVerse).toBe(1)
            expect(retrieved?.endChapter).toBe(23)
            expect(retrieved?.endVerse).toBe(6)
            expect(retrieved?.totalVerses).toBe(6)
            expect(retrieved?.maxPoints).toBe(150)
            expect(retrieved?.dueDate?.getTime()).toBe(dueDate.getTime())
            expect(retrieved?.state).toBe("PUBLISHED")
        })

        it("stores submission with all progress fields", async () => {
            const submission = await getOrCreateSubmission({
                assignmentId: testAssignmentId,
                studentUserId: testStudentId,
                totalVerses: 31,
                submissionId: "google-submission-123",
            })

            await updateSubmissionProgress(submission.id, {
                completedVerses: 20,
                averageWpm: 55,
                averageAccuracy: 92,
                isCompleted: false,
                grade: 85,
            })

            const updated = await getSubmissionByStudent(
                testAssignmentId,
                testStudentId,
            )

            expect(updated?.completedVerses).toBe(20)
            expect(updated?.totalVerses).toBe(31)
            expect(updated?.averageWpm).toBe(55)
            expect(updated?.averageAccuracy).toBe(92)
            expect(updated?.isCompleted).toBe(0)
            expect(updated?.grade).toBe(85)
            expect(updated?.submissionId).toBe("google-submission-123")
        })
    })
})
