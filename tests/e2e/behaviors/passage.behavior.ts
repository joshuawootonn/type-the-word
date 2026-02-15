import { expect, Locator, Page } from "@playwright/test"

export class PassageBehavior {
    constructor(private readonly page: Page) {}

    async openPsalm23() {
        await this.page.goto("/passage/psalm_23?translation=nlt")
        await expect(
            this.page.getByTestId("passage-root").first(),
        ).toBeVisible()
        await expect
            .poll(async () => {
                const response =
                    await this.page.request.get("/api/auth/session")
                const data = (await response.json()) as {
                    user?: { email?: string }
                }
                return Boolean(data.user?.email)
            })
            .toBe(true)
    }

    async typeVerse(verseNumber: number, text: string) {
        const focusButton = this.page.getByTestId(
            `focus-verse-button-${verseNumber}`,
        )
        if ((await focusButton.count()) > 0) {
            await focusButton.first().click()
        }

        await this.page
            .locator(
                `[data-testid="current-verse-${verseNumber}"], [data-testid="readonly-verse-${verseNumber}"]`,
            )
            .first()
            .click()

        await this.page.getByTestId(`current-verse-${verseNumber}`).click()
        await this.page.getByRole("textbox").first().pressSequentially(text)
    }

    async expectVerseTyped(verseNumber: number) {
        await expect
            .poll(
                async () =>
                    this.findVerse(verseNumber).getAttribute(
                        "data-typed-in-history",
                    ),
                { timeout: 20_000 },
            )
            .toBe("true")
    }

    async expectChapterLogContains(text: RegExp | string) {
        await expect(this.page.getByTestId("chapter-log")).toBeVisible()
        await expect(this.page.getByTestId("chapter-log")).toContainText(text)
    }

    async getFirstProgressLineHeight(): Promise<number> {
        const line = this.page.getByTestId("typed-verse-line").first()
        await expect(line).toBeVisible()
        const rawHeight = await line.getAttribute("data-line-height")
        return Number(rawHeight ?? "0")
    }

    async expectProgressLineHeightGreaterThan(previousHeight: number) {
        await expect
            .poll(async () => this.getFirstProgressLineHeight())
            .toBeGreaterThan(previousHeight)
    }

    private findVerse(verseNumber: number): Locator {
        return this.page
            .locator(
                `[data-testid="readonly-verse-${verseNumber}"], [data-testid="current-verse-${verseNumber}"]`,
            )
            .first()
    }
}
