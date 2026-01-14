import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { Translation } from './parseEsv'
import { validTranslations } from './translations'

const COOKIE_NAME = 'lastTranslation'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

/**
 * Get the last used translation from cookie.
 * Defaults to 'esv' if cookie doesn't exist or has invalid value.
 *
 * Note: Cookies are set by API routes when user actions occur
 * (typing verses, changing selectors).
 */
export async function getLastTranslation(): Promise<Translation> {
    const cookieStore = await cookies()
    const value = cookieStore.get(COOKIE_NAME)?.value

    if (value && validTranslations.includes(value as Translation)) {
        return value as Translation
    }

    return 'esv'
}

/**
 * Set the last used translation cookie on a NextResponse.
 * This should be called in API routes when a user action indicates
 * their preferred translation (typing a verse, changing selector).
 *
 * @param response - The NextResponse object to set the cookie on
 * @param translation - The translation to save
 */
export function setTranslationCookie(
    response: NextResponse,
    translation: Translation,
): void {
    if (!validTranslations.includes(translation)) {
        return // Don't set invalid translations
    }

    response.cookies.set(COOKIE_NAME, translation, {
        maxAge: COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
    })
}
