import { and, asc, eq, isNull, or, sql } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { adminErrorResponseSchema } from "~/app/api/admin/users/deactivate/schemas"
import { isAdminEmail } from "~/lib/auth/admin"
import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import {
    classroomAssignment,
    classroomSubmission,
    typedVerses,
    typingSessions,
    userDailyActivity,
    users,
} from "~/server/db/schema"

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

    const typingSessionStats = db
        .select({
            userId: typingSessions.userId,
            lastTypingSessionAt:
                sql<Date | null>`MAX(${typingSessions.createdAt})`.as(
                    "lastTypingSessionAt",
                ),
            typingSessionCount:
                sql<number>`COUNT(${typingSessions.id})::int`.as(
                    "typingSessionCount",
                ),
        })
        .from(typingSessions)
        .groupBy(typingSessions.userId)
        .as("typingSessionStats")

    const typedVerseStats = db
        .select({
            userId: typedVerses.userId,
            lastTypedVerseAt:
                sql<Date | null>`MAX(${typedVerses.createdAt})`.as(
                    "lastTypedVerseAt",
                ),
            typedVerseCount: sql<number>`COUNT(${typedVerses.id})::int`.as(
                "typedVerseCount",
            ),
        })
        .from(typedVerses)
        .groupBy(typedVerses.userId)
        .as("typedVerseStats")

    const dailyActivityStats = db
        .select({
            userId: userDailyActivity.userId,
            activeDaysLast30:
                sql<number>`COUNT(${userDailyActivity.date})::int`.as(
                    "activeDaysLast30",
                ),
            versesTypedLast30:
                sql<number>`COALESCE(SUM(${userDailyActivity.verseCount}), 0)::int`.as(
                    "versesTypedLast30",
                ),
        })
        .from(userDailyActivity)
        .where(sql`${userDailyActivity.date} >= NOW() - INTERVAL '30 days'`)
        .groupBy(userDailyActivity.userId)
        .as("dailyActivityStats")

    const classroomTeacherStats = db
        .select({
            userId: classroomAssignment.teacherUserId,
            teacherAssignmentCount:
                sql<number>`COUNT(${classroomAssignment.id})::int`.as(
                    "teacherAssignmentCount",
                ),
        })
        .from(classroomAssignment)
        .groupBy(classroomAssignment.teacherUserId)
        .as("classroomTeacherStats")

    const classroomStudentStats = db
        .select({
            userId: classroomSubmission.studentUserId,
            studentSubmissionCount:
                sql<number>`COUNT(${classroomSubmission.id})::int`.as(
                    "studentSubmissionCount",
                ),
        })
        .from(classroomSubmission)
        .groupBy(classroomSubmission.studentUserId)
        .as("classroomStudentStats")

    const result = await db
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
            accountCreatedAt: users.createdAt,
            lastTypingSessionAt: typingSessionStats.lastTypingSessionAt,
            lastTypedVerseAt: typedVerseStats.lastTypedVerseAt,
            typingSessionCount: sql<number>`COALESCE(${typingSessionStats.typingSessionCount}, 0)::int`,
            typedVerseCount: sql<number>`COALESCE(${typedVerseStats.typedVerseCount}, 0)::int`,
            activeDaysLast30: sql<number>`COALESCE(${dailyActivityStats.activeDaysLast30}, 0)::int`,
            versesTypedLast30: sql<number>`COALESCE(${dailyActivityStats.versesTypedLast30}, 0)::int`,
            hasClassroomData: sql<boolean>`
                COALESCE(${classroomTeacherStats.teacherAssignmentCount}, 0) > 0
                OR COALESCE(${classroomStudentStats.studentSubmissionCount}, 0) > 0
            `,
        })
        .from(users)
        .leftJoin(typingSessionStats, eq(typingSessionStats.userId, users.id))
        .leftJoin(typedVerseStats, eq(typedVerseStats.userId, users.id))
        .leftJoin(dailyActivityStats, eq(dailyActivityStats.userId, users.id))
        .leftJoin(
            classroomTeacherStats,
            eq(classroomTeacherStats.userId, users.id),
        )
        .leftJoin(
            classroomStudentStats,
            eq(classroomStudentStats.userId, users.id),
        )
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
