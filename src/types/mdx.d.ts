declare module "*.mdx" {
    import type { ComponentType } from "react"

    export const metadata: {
        title?: string
        description?: string
    }
    export const toc: unknown

    const MDXContent: ComponentType<Record<string, unknown>>
    export default MDXContent
}
