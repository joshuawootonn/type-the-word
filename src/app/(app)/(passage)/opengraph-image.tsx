import { env } from "~/env.mjs"

export const runtime = "edge"

export const contentType = "image/png"

export default async function Image() {
    return await fetch(new URL("/api/og", env.DEPLOYED_URL))
}
