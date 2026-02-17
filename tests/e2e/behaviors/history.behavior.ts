import { expect, Page } from "@playwright/test"

export class HistoryBehavior {
    constructor(private readonly page: Page) {}

    async openLogPage() {
        await this.page.goto("/history/log?translation=nlt")
        await expect(this.page.getByTestId("history-log-root")).toBeVisible()
    }

    async getCurrentMonthVerseTotal(): Promise<number> {
        const currentMonth = this.page
            .getByTestId("history-month-total-verses")
            .first()
        await expect(currentMonth).toBeVisible()

        const text = (await currentMonth.textContent()) ?? ""
        const match = text.match(/Verses:\s*(\d+)/)
        return Number(match?.[1] ?? "0")
    }
}
