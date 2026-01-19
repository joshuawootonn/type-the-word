import { NextRequest, NextResponse } from "next/server"

import { setTranslationCookie } from "~/lib/last-translation"
import { Translation } from "~/lib/parseEsv"
import { validTranslations } from "~/lib/translations"

export async function POST(request: NextRequest) {
    const { translation } = (await request.json()) as {
        translation: Translation
    }

    if (!validTranslations.includes(translation)) {
        return NextResponse.json(
            { error: "Invalid translation" },
            { status: 400 },
        )
    }

    const response = NextResponse.json({ success: true })
    setTranslationCookie(response, translation)

    return response
}
