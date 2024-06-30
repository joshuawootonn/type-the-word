export const runtime = 'edge'

export const contentType = 'image/png'

export default async function Image() {
    return await fetch(
        new URL(
            '/api/og',
            process.env.VERCEL_URL ?? 'https://typetheword.site',
        ),
    )
}
