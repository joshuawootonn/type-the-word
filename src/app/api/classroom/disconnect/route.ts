import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

/**
 * Disconnect from Google Classroom (remove stored tokens)
 */
export async function POST() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classroomRepo = new ClassroomRepository(db)
    await classroomRepo.deleteTeacherToken(session.user.id)

    return NextResponse.json({ success: true })
}
