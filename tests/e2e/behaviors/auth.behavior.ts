import { expect, Page } from "@playwright/test"

import { E2eUser } from "../fixtures/user"

export class AuthBehavior {
    constructor(private readonly page: Page) {}

    async signupByApi(user: E2eUser) {
        const response = await this.page.request.post("/api/auth/signup", {
            data: {
                firstName: user.firstName,
                email: user.email,
                password: user.password,
            },
        })
        expect(response.ok()).toBeTruthy()
    }

    async loginViaApi(user: E2eUser) {
        const callbackUrl = "/passage/psalm_23?translation=nlt"
        const csrfResponse = await this.page.request.get("/api/auth/csrf")
        expect(csrfResponse.ok()).toBeTruthy()
        const csrfPayload = (await csrfResponse.json()) as { csrfToken: string }

        const body = new URLSearchParams({
            csrfToken: csrfPayload.csrfToken,
            email: user.email,
            password: user.password,
            callbackUrl,
            json: "true",
        })

        const loginResponse = await this.page.request.post(
            "/api/auth/callback/credentials?json=true",
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data: body.toString(),
            },
        )
        expect(loginResponse.ok()).toBeTruthy()

        const loginPayload = (await loginResponse.json()) as { url?: string }
        expect(loginPayload.url).toContain("/passage/psalm_23?translation=nlt")

        await this.page.goto(callbackUrl)
        await expect(this.page).toHaveURL(
            /\/passage\/psalm_23\?translation=nlt/,
        )
    }
}
