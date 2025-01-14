'use client'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'

export function GlobalHotkeys() {
    const router = useRouter()

    useHotkeys(
        'mod+shift+y',
        () => void router.push('/history'),
        { enableOnFormTags: true },
        [router],
    )

    return null
}

type OS = 'MacOS' | 'Windows' | 'iOS' | 'Linux' | 'Android'

export function getOS(): { os: OS; isMobile: boolean } {
    if (typeof window === 'undefined') {
        return { os: 'Windows', isMobile: false }
    }
    const userAgent = window.navigator.userAgent,
        platform: string =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            window.navigator?.userAgentData?.platform ??
            window.navigator.platform,
        macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod']

    if (macosPlatforms.indexOf(platform) !== -1) {
        return { os: 'MacOS', isMobile: false }
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        return { os: 'iOS', isMobile: true }
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        return { os: 'Windows', isMobile: false }
    } else if (/Android/.test(userAgent)) {
        return { os: 'Android', isMobile: true }
    } else if (/Linux/.test(platform)) {
        return { os: 'Linux', isMobile: false }
    }

    return { os: 'Windows', isMobile: false }
}
