import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { cache } from "react"

import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import {
    BuiltinThemeRecord,
    BuiltinThemeRepository,
} from "~/server/repositories/builtinTheme.repository"
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository"
import { TypedVerse } from "~/server/repositories/typingSession.repository"
import { UserThemeRecord } from "~/server/repositories/userTheme.repository"
import { UserThemeRepository } from "~/server/repositories/userTheme.repository"

import { getLastTranslation } from "./last-translation"
import { Translation } from "./parseEsv"

interface NavigationShellProps {
    lastTypedVerse: TypedVerse | null
    userThemes: UserThemeRecord[]
    builtinThemes: BuiltinThemeRecord[]
    lastTranslation: Translation
    hasClassroomAccess: boolean
}

export const getNavigationShellProps = cache(
    async (): Promise<NavigationShellProps> => {
        const session = await getServerSession(authOptions)
        const builtInThemeRepository = new BuiltinThemeRepository(db)
        const builtinThemes = await builtInThemeRepository.getMany()
        const lastTranslation = await getLastTranslation()
        const cookieStore = await cookies()
        const hasClassroomAccess = cookieStore.has("classroomTeacher")

        if (!session?.user) {
            return {
                lastTypedVerse: null,
                userThemes: [],
                builtinThemes,
                lastTranslation,
                hasClassroomAccess,
            }
        }

        const typedVerseRepository = new TypedVerseRepository(db)
        const lastTypedVerse = await typedVerseRepository.getOneOrNull({
            userId: session.user.id,
        })
        const userThemeRepository = new UserThemeRepository(db)
        const userThemes = await userThemeRepository.getMany({
            userId: session.user.id,
        })

        return {
            lastTypedVerse,
            userThemes,
            builtinThemes,
            lastTranslation,
            hasClassroomAccess,
        }
    },
)
