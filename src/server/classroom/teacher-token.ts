import { refreshAccessToken } from "~/server/clients/classroom.client"
import { classroomTeacherToken } from "~/server/db/schema"
import {
    getTeacherToken,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

type ClassroomTeacherToken = typeof classroomTeacherToken.$inferSelect

export async function getValidTeacherToken(
    teacherUserId: string,
): Promise<ClassroomTeacherToken> {
    const tokenRecord = await getTeacherToken(teacherUserId)

    if (!tokenRecord) {
        throw new Error("Google Classroom not connected")
    }

    const now = new Date()
    if (tokenRecord.expiresAt <= now) {
        const refreshed = await refreshAccessToken(tokenRecord.refreshToken)

        await updateTeacherTokenAccess(
            teacherUserId,
            refreshed.accessToken,
            refreshed.expiresAt,
        )

        return {
            ...tokenRecord,
            accessToken: refreshed.accessToken,
            expiresAt: refreshed.expiresAt,
        }
    }

    return tokenRecord
}
