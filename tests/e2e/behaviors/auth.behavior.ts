import { expect, Page } from "@playwright/test"

import { E2eUser } from "../fixtures/user"

function readAuthUrlPayload(payload: unknown): string {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Expected classroom auth response to be an object")
    }

    if (!("authUrl" in payload) || typeof payload.authUrl !== "string") {
        throw new Error("Expected classroom auth response to include authUrl")
    }

    return payload.authUrl
}

export class AuthBehavior {
    constructor(private readonly page: Page) {}

    async signupByApi(user: E2eUser): Promise<void> {
        const response = await this.page.request.post("/api/auth/signup", {
            data: {
                firstName: user.firstName,
                email: user.email,
                password: user.password,
            },
        })
        expect(response.ok()).toBeTruthy()
    }

    async loginViaApi(user: E2eUser): Promise<void> {
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

    async connectTeacherClassroomViaApi(): Promise<void> {
        const response = await this.page.request.get("/api/classroom/auth")
        expect(response.ok()).toBeTruthy()

        const authUrl = readAuthUrlPayload(await response.json())
        expect(authUrl).toContain("/api/classroom/callback")

        await this.page.goto(authUrl, { waitUntil: "domcontentloaded" })
        await expect(this.page).toHaveURL(/\/classroom\?success=true/)
    }

    async connectStudentClassroomViaApi(): Promise<void> {
        const response = await this.page.request.get(
            "/api/classroom/student-auth",
        )
        expect(response.ok()).toBeTruthy()

        const authUrl = readAuthUrlPayload(await response.json())
        expect(authUrl).toContain("/api/classroom/student-callback")

        await this.page.goto(authUrl, { waitUntil: "domcontentloaded" })
        await expect(this.page).toHaveURL(/\/classroom\?student_success=true/)
    }
}
