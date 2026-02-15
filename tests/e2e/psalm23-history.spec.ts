import { expect, test } from "@playwright/test"

import { AuthBehavior } from "./behaviors/auth.behavior"
import { HistoryBehavior } from "./behaviors/history.behavior"
import { PassageBehavior } from "./behaviors/passage.behavior"
import { createE2eUser } from "./fixtures/user"

test("types Psalm 23:1-2 and syncs passage + history views", async ({
    page,
    request,
}) => {
    const user = createE2eUser()
    const auth = new AuthBehavior(page, request)
    const passage = new PassageBehavior(page)
    const history = new HistoryBehavior(page)

    await auth.signupByApi(user)
    await auth.loginViaUi(user)

    await passage.openPsalm23()
    await passage.typeVerse(
        1,
        "The LORD is my shepherd; I have all that I need. ",
    )
    await passage.expectVerseTyped(1)
    await passage.expectChapterLogContains(/Psalm 23:1/)

    const firstLineHeight = await passage.getFirstProgressLineHeight()

    await history.openLogPage()
    await expect
        .poll(async () => history.getCurrentMonthVerseTotal())
        .toBeGreaterThanOrEqual(1)

    await passage.openPsalm23()
    await passage.typeVerse(
        2,
        "He lets me rest in green meadows; he leads me beside peaceful streams. ",
    )
    await passage.expectVerseTyped(2)
    await passage.expectProgressLineHeightGreaterThan(firstLineHeight)
    await passage.expectChapterLogContains(/Psalm 23:1-2/)

    await history.openLogPage()
    await expect
        .poll(async () => history.getCurrentMonthVerseTotal())
        .toBeGreaterThanOrEqual(2)

    await passage.openPsalm23()
    await passage.expectVerseTyped(1)
    await passage.expectVerseTyped(2)
})
