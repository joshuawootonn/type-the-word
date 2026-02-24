import { google } from "googleapis"

import { env } from "~/env.mjs"

export function createGoogleOAuth2Client() {
    return new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
    )
}

export async function getGoogleUserId(accessToken: string): Promise<string> {
    if (process.env.E2E_MOCK_CLASSROOM === "1") {
        return "e2e-student-google-user"
    }

    const oauth2Client = createGoogleOAuth2Client()
    oauth2Client.setCredentials({
        access_token: accessToken,
    })

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const response = await oauth2.userinfo.get()

    const id = response.data.id
    if (!id) {
        throw new Error("Failed to fetch Google user id")
    }

    return id
}

export async function refreshGoogleAccessToken(
    refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
    const oauth2Client = createGoogleOAuth2Client()
    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
        throw new Error("Failed to refresh Google access token")
    }

    return {
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(Date.now() + 3600 * 1000),
    }
}
