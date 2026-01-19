import { refreshAccessToken } from "~/server/clients/classroom.client"
import {
    getStudentToken,
    updateStudentTokenAccess,
} from "~/server/repositories/classroom.repository"

export async function getValidStudentToken(userId: string): Promise<{
    accessToken: string
    googleUserId: string
}> {
    const tokenRecord = await getStudentToken(userId)

    if (!tokenRecord) {
        throw new Error("Student Google Classroom account not connected")
    }

    let accessToken = tokenRecord.accessToken
    const now = new Date()
    if (tokenRecord.expiresAt <= now) {
        const refreshed = await refreshAccessToken(tokenRecord.refreshToken)
        accessToken = refreshed.accessToken

        await updateStudentTokenAccess(
            userId,
            refreshed.accessToken,
            refreshed.expiresAt,
        )
    }

    return {
        accessToken,
        googleUserId: tokenRecord.googleUserId,
    }
}
