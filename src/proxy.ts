import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { isValidTranslation, parseTranslation } from './lib/translations'

const COOKIE_NAME = 'lastTranslation'

export function proxy(request: NextRequest) {
    const url = request.nextUrl.clone()
    const translation = url.searchParams.get('translation')

    // Validate translation if present
    if (translation) {
        if (!isValidTranslation(translation)) {
            // Invalid translation - use cookie or default
            const cookieTranslation = request.cookies.get(COOKIE_NAME)?.value
            const validTranslation = parseTranslation(cookieTranslation)

            url.searchParams.set('translation', validTranslation)
            return NextResponse.redirect(url)
        }
        // Valid translation - pass through
        return NextResponse.next()
    }

    // No translation param - check cookie and redirect
    const lastTranslation = request.cookies.get(COOKIE_NAME)?.value
    const validTranslation = parseTranslation(lastTranslation)

    url.searchParams.set('translation', validTranslation)
    return NextResponse.redirect(url)
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        // Match passage routes
        '/passage/:path*',
        // Match all history routes (base and sub-routes)
        '/history',
        '/history/:path*',
    ],
}
