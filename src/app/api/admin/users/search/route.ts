import { and, asc, isNull, or, sql } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { adminErrorResponseSchema } from "~/app/api/admin/users/deactivate/schemas"
import { isAdminEmail } from "~/lib/auth/admin"
import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { users } from "~/server/db/schema"

import {
    adminUserSearchResponseSchema,
    type AdminUserSearchResponse,
} from "./schemas"

export async function GET(request: NextRequest): Promise<Response> {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json(
            adminErrorResponseSchema.parse({ error: "Unauthorized" }),
            { status: 401 },
        )
    }

    if (!isAdminEmail(session.user.email)) {
        return NextResponse.json(
            adminErrorResponseSchema.parse({ error: "Forbidden" }),
            { status: 403 },
        )
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""

    if (query.length < 2) {
        return NextResponse.json(
            adminUserSearchResponseSchema.parse({ users: [] }),
        )
    }

    const normalizedQuery = query.toLowerCase()
    const likePattern = `%${normalizedQuery}%`

    const result = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
        })
        .from(users)
        .where(
            and(
                isNull(users.deactivatedAt),
                or(
                    sql`LOWER(${users.email}) LIKE ${likePattern}`,
                    sql`LOWER(COALESCE(${users.name}, '')) LIKE ${likePattern}`,
                ),
            ),
        )
        .orderBy(asc(users.email))
        .limit(20)

    const response: AdminUserSearchResponse = {
        users: result,
    }

    return NextResponse.json(adminUserSearchResponseSchema.parse(response))
}
