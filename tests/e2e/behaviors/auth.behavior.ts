import { expect, Page, APIRequestContext } from "@playwright/test"

import { E2eUser } from "../fixtures/user"

export class AuthBehavior {
    constructor(
        private readonly page: Page,
        private readonly request: APIRequestContext,
    ) {}

    async signupByApi(user: E2eUser) {
        const response = await this.request.post("/api/auth/signup", {
            data: {
                firstName: user.firstName,
                email: user.email,
                password: user.password,
            },
        })
        expect(response.ok()).toBeTruthy()
    }

    async loginViaUi(user: E2eUser) {
        const callbackUrl = encodeURIComponent(
            "/passage/psalm_23?translation=nlt",
        )
        await this.page.goto(`/auth/login?callbackUrl=${callbackUrl}`)
        await this.page
            .getByTestId("login-email-field")
            .locator("input")
            .fill(user.email)
        await this.page
            .getByTestId("login-password-field")
            .locator("input")
            .fill(user.password)
        await this.page.getByTestId("login-submit").click()
        await expect(this.page).toHaveURL(
            /\/passage\/psalm_23\?translation=nlt/,
        )
    }
}
