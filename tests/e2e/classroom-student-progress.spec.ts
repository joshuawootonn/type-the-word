import { expect, type Locator, type Page, test } from "@playwright/test"
import { z } from "zod"

import { AuthBehavior } from "./behaviors/auth.behavior"
import { PassageBehavior } from "./behaviors/passage.behavior"
import { createE2eUser } from "./fixtures/user"

const createAssignmentResponseSchema = z.object({
    assignmentId: z.string(),
})

const publishAssignmentResponseSchema = z.object({
    success: z.literal(true),
})

test("student sees assignment progress on assignment and course pages", async ({
    page,
}) => {
    const teacher = createE2eUser()
    const student = createE2eUser()
    const auth = new AuthBehavior(page)
    const passage = new PassageBehavior(page)
    const assignmentTitle = `E2E Progress Assignment ${Date.now()}`

    await auth.signupByApi(teacher)
    await auth.signupByApi(student)

    await auth.loginViaApi(teacher)
    await auth.connectTeacherClassroomViaApi()

    const createAssignmentResponse = await page.request.post(
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
                dueDate: "2000-01-01",
            },
        },
    )
    expect(createAssignmentResponse.ok()).toBeTruthy()
    const createdAssignment = createAssignmentResponseSchema.parse(
        await createAssignmentResponse.json(),
    )

    const publishAssignmentResponse = await page.request.post(
        `/api/classroom/assignments/${createdAssignment.assignmentId}/publish`,
    )
    expect(publishAssignmentResponse.ok()).toBeTruthy()
    publishAssignmentResponseSchema.parse(
        await publishAssignmentResponse.json(),
    )

    await auth.loginViaApi(student)
    await auth.connectStudentClassroomViaApi()

    await page.goto(
        `/classroom/e2e-course-1/assignment/${createdAssignment.assignmentId}`,
        {
            waitUntil: "domcontentloaded",
        },
    )

    await expect(page.getByTestId("passage-root").first()).toBeVisible()
    await expect(page.getByText("0 of 2 verses completed")).toBeVisible()

    await passage.typeVerse(
        1,
        "The LORD is my shepherd; I have all that I need. ",
    )
    await passage.expectVerseTyped(1)

    await expect(page.getByText("Completion")).toBeVisible()
    await expect(page.getByText("1 of 2 verses completed")).toBeVisible({
        timeout: 15_000,
    })

    await page.goto("/classroom/e2e-course-1", {
        waitUntil: "domcontentloaded",
    })
    await expect(
        page.getByRole("heading", { name: "E2E English 101" }),
    ).toBeVisible({ timeout: 20_000 })

    const assignmentCard = await findAssignmentCard(page, assignmentTitle)
    await expect(assignmentCard).toContainText("Progress", {
        timeout: 15_000,
    })
    await expect(assignmentCard).toContainText("Verses: 1 / 2", {
        timeout: 15_000,
    })
})

async function findAssignmentCard(
    page: Page,
    assignmentTitle: string,
): Promise<Locator> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const isLoading = await page
            .getByText("Loading.")
            .isVisible()
            .catch(() => false)
        if (isLoading) {
            await page.waitForTimeout(500)
            continue
        }

        const assignmentCard = page
            .locator("a")
            .filter({ hasText: assignmentTitle })
            .first()

        if ((await assignmentCard.count()) > 0) {
            return assignmentCard
        }

        const loadMoreButton = page.getByRole("button", { name: "Load More" })
        if (await loadMoreButton.isVisible()) {
            await loadMoreButton.click()
            await page.waitForTimeout(500)
            continue
        }

        await page.waitForTimeout(500)
    }

    throw new Error(`Could not find assignment card for "${assignmentTitle}"`)
}
