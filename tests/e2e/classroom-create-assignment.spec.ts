import { expect, test } from "@playwright/test"

import { AuthBehavior } from "./behaviors/auth.behavior"
import { createE2eUser } from "./fixtures/user"

test("teacher connects, creates assignment, and publishes it", async ({
    page,
}) => {
    const user = createE2eUser()
    const auth = new AuthBehavior(page)
    const assignmentTitle = `E2E Assignment ${Date.now()}`

    await auth.signupByApi(user)
    await auth.loginViaApi(user)

    await page.goto("/classroom")
    await page.getByRole("button", { name: "Connect as Teacher" }).click()

    await expect(page).toHaveURL(/\/classroom\?success=true/)
    await expect(
        page.getByText("Teacher account connected successfully."),
    ).toBeVisible()

    await page.getByRole("link", { name: "Create assignment" }).click()
    await expect(
        page.getByRole("heading", { name: "Create Assignment" }),
    ).toBeVisible()

    await page.getByLabel("Title").fill(assignmentTitle)
    await page.getByRole("button", { name: "Create Assignment" }).click()

    await expect(
        page.getByText(
            "Assignment created in draft mode. Publish it to make it visible to students.",
        ),
    ).toBeVisible()

    await page.goto("/classroom/e2e-course-1")
    const assignmentRow = page
        .getByRole("row")
        .filter({ hasText: assignmentTitle })

    await expect(assignmentRow).toContainText("Draft")
    await assignmentRow.getByRole("button", { name: "Publish" }).click()
    await expect(assignmentRow).toContainText("Published")
})
