export const runtime = 'edge'

export const contentType = 'image/png'

export default async function Image() {
    return await fetch('https://typetheword.site/api/og')
}
