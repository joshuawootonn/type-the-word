declare module "@next/mdx" {
    import type { NextConfig } from "next"

    interface MdxOptions {
        extension?: RegExp
        options?: {
            remarkPlugins?: Array<string | [string, Record<string, unknown>]>
            rehypePlugins?: Array<string | [string, Record<string, unknown>]>
        }
    }

    type WithMdx = (nextConfig: NextConfig) => NextConfig

    export default function createMDX(options?: MdxOptions): WithMdx
}
