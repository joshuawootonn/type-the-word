import { eq } from "drizzle-orm"

import { db } from "~/server/db"
import {
    accounts,
    classroomAssignment,
    classroomStudentToken,
    classroomSubmission,
    classroomTeacherToken,
    sessions,
    users,
} from "~/server/db/schema"

const DEACTIVATED_NAME_SUFFIX = " (deactivated)"
const DEACTIVATED_EMAIL_TAG = "deactivated"

function buildDeactivatedName(name: string | null): string {
    const baseName = name?.trim() ? name.trim() : "Deactivated User"
    if (baseName.endsWith(DEACTIVATED_NAME_SUFFIX)) {
        return baseName
    }

    const deactivatedName = `${baseName}${DEACTIVATED_NAME_SUFFIX}`
    return deactivatedName.slice(0, 255)
}

function buildDeactivatedEmail(email: string, userId: string): string {
    const atIndex = email.lastIndexOf("@")
    const userIdSuffix = userId.slice(0, 8)

    if (atIndex === -1) {
        return `${email}+${DEACTIVATED_EMAIL_TAG}+${userIdSuffix}`.slice(0, 255)
    }

    const localPart = email.slice(0, atIndex)
    const domainPart = email.slice(atIndex + 1)
    const alias = `${localPart}+${DEACTIVATED_EMAIL_TAG}+${userIdSuffix}@${domainPart}`
    return alias.slice(0, 255)
}

export class AdminAccountError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number) {
        super(message)
        this.name = "AdminAccountError"
        this.statusCode = statusCode
    }
}

type DeactivateUserAccountInput = {
    adminUserId: string
    targetUserId: string
}

type DeactivateUserAccountResult = {
    userId: string
    message: string
}

export async function deactivateUserAccount({
    adminUserId,
    targetUserId,
}: DeactivateUserAccountInput): Promise<DeactivateUserAccountResult> {
    if (adminUserId === targetUserId) {
        throw new AdminAccountError(
            "You cannot deactivate your own account.",
            400,
        )
    }

    return db.transaction(async tx => {
        const targetUser = await tx.query.users.findFirst({
            where: eq(users.id, targetUserId),
        })

        if (!targetUser) {
            throw new AdminAccountError("User not found.", 404)
        }

        if (targetUser.deactivatedAt !== null) {
            throw new AdminAccountError("User is already deactivated.", 409)
        }

        const [submissionRecord, assignmentRecord] = await Promise.all([
            tx.query.classroomSubmission.findFirst({
                where: eq(classroomSubmission.studentUserId, targetUserId),
                columns: { id: true },
            }),
            tx.query.classroomAssignment.findFirst({
                where: eq(classroomAssignment.teacherUserId, targetUserId),
                columns: { id: true },
            }),
        ])

        if (submissionRecord || assignmentRecord) {
            throw new AdminAccountError(
                "This user cannot be deactivated because they have classroom assignment data.",
                409,
            )
        }

        await tx
            .update(users)
            .set({
                name: buildDeactivatedName(targetUser.name),
                email: buildDeactivatedEmail(targetUser.email, targetUserId),
                hashedPassword: null,
                emailVerified: null,
                image: null,
                deactivatedAt: new Date(),
            })
            .where(eq(users.id, targetUserId))

        await Promise.all([
            tx.delete(accounts).where(eq(accounts.userId, targetUserId)),
            tx.delete(sessions).where(eq(sessions.userId, targetUserId)),
            tx
                .delete(classroomTeacherToken)
                .where(eq(classroomTeacherToken.userId, targetUserId)),
            tx
                .delete(classroomStudentToken)
                .where(eq(classroomStudentToken.userId, targetUserId)),
        ])

        return {
            userId: targetUserId,
            message: "User account was deactivated.",
        }
    })
}
