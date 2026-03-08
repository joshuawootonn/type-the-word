import { expect, test } from "@playwright/test"
import { z } from "zod"

import { AuthBehavior } from "./behaviors/auth.behavior"
import { createE2eUser } from "./fixtures/user"

const createAssignmentResponseSchema = z.object({
    assignmentId: z.string(),
})

test("second teacher is approved and can collaborate on assignments", async ({
    page,
}) => {
    const domain = `org-${Date.now()}.example.com`
    const teacherAdmin = createE2eUser(domain)
    const teacherPending = createE2eUser(domain)
    const auth = new AuthBehavior(page)
    const assignmentTitle = `Collaborative Assignment ${Date.now()}`

    await auth.signupByApi(teacherAdmin)
    await auth.signupByApi(teacherPending)

    await auth.loginViaApi(teacherAdmin)
    await auth.connectTeacherClassroomViaApi()

    const createdAssignmentResponse = await page.request.post(
        "/api/classroom/assignments",
        {
            data: {
                courseId: "e2e-course-1",
                title: assignmentTitle,
                translation: "nlt",
                book: "psalm",
                startChapter: 23,
                startVerse: 1,
                endChapter: 23,
                endVerse: 2,
                maxPoints: 100,
                dueDate: "2099-01-01",
            },
        },
    )
    expect(createdAssignmentResponse.ok()).toBeTruthy()
    const createdAssignment = createAssignmentResponseSchema.parse(
        await createdAssignmentResponse.json(),
    )
    const publishResponse = await page.request.post(
        `/api/classroom/assignments/${createdAssignment.assignmentId}/publish`,
    )
    expect(publishResponse.ok()).toBeTruthy()

    await auth.loginViaApi(teacherPending)
    await auth.connectTeacherClassroomViaApi({
        expectedQuery: "pending_teacher=true",
    })
    await expect(
        page
            .getByText(
                "Your teacher account is connected and waiting for organization admin approval.",
            )
            .first(),
    ).toBeVisible()

    await auth.loginViaApi(teacherAdmin)
    await page.goto("/classroom/organization", {
        waitUntil: "domcontentloaded",
    })
    await expect(page.getByText(teacherPending.email).first()).toBeVisible()
    await page.getByRole("button", { name: "Approve" }).first().click()
    await expect(
        page
            .getByRole("row")
            .filter({ hasText: teacherPending.email })
            .getByText("Pending"),
    ).toHaveCount(0)

    await auth.loginViaApi(teacherPending)
    await page.request.get("/api/classroom/courses")
    await page.goto("/classroom/e2e-course-1", {
        waitUntil: "domcontentloaded",
    })
    await expect(
        page.getByRole("heading", { name: "E2E English 101" }),
    ).toBeVisible()
    await expect(page.getByText(assignmentTitle)).toBeVisible()
})
