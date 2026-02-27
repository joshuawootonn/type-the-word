import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { isAdminEmail } from "~/lib/auth/admin"
import { authOptions } from "~/server/auth"
import {
    AdminAccountError,
    deactivateUserAccount,
} from "~/server/repositories/adminAccount.repository"

import {
    adminErrorResponseSchema,
    deactivateUserRequestSchema,
    deactivateUserResponseSchema,
    type DeactivateUserResponse,
    type AdminErrorResponse,
} from "./schemas"

export async function POST(request: Request): Promise<Response> {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        const error: AdminErrorResponse = { error: "Unauthorized" }
        return NextResponse.json(adminErrorResponseSchema.parse(error), {
            status: 401,
        })
    }

    if (!isAdminEmail(session.user.email)) {
        const error: AdminErrorResponse = { error: "Forbidden" }
        return NextResponse.json(adminErrorResponseSchema.parse(error), {
            status: 403,
        })
    }

    const requestBody: unknown = await request.json()
    const parsed = deactivateUserRequestSchema.safeParse(requestBody)
    if (!parsed.success) {
        const error: AdminErrorResponse = { error: "Invalid request body" }
        return NextResponse.json(adminErrorResponseSchema.parse(error), {
            status: 400,
        })
    }

    try {
        const result = await deactivateUserAccount({
            adminUserId: session.user.id,
            targetUserId: parsed.data.userId,
        })
        const response: DeactivateUserResponse = {
            success: true,
            userId: result.userId,
            message: result.message,
        }

        return NextResponse.json(deactivateUserResponseSchema.parse(response))
    } catch (error) {
        if (error instanceof AdminAccountError) {
            const response: AdminErrorResponse = { error: error.message }
            return NextResponse.json(adminErrorResponseSchema.parse(response), {
                status: error.statusCode,
            })
        }

        const response: AdminErrorResponse = {
            error: "Failed to deactivate user",
        }
        return NextResponse.json(adminErrorResponseSchema.parse(response), {
            status: 500,
        })
    }
}
