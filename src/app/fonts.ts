import { IBM_Plex_Mono, Poppins } from 'next/font/google'

export const ibmPlexMono = IBM_Plex_Mono({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-ibm-plex',
})

export const poppins = Poppins({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    variable: '--font-poppins',
})
