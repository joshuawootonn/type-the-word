import matter from "gray-matter"
import { compileMDX } from "next-mdx-remote/rsc"
import { readFile } from "node:fs/promises"
import path from "path"
import { cache } from "react"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { fileURLToPath } from "url"

import { docsMdxComponents } from "~/components/docs/mdx-components"

import { docsNavigation } from "./navigation"
import { extractToc } from "./toc"
import { DocsNavItem, DocsPage, DocsPageMeta } from "./types"

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = path.resolve(CURRENT_DIR, "../../../content/docs")

function normalizeSlug(slug: string[]): string[] {
    return slug.filter(Boolean)
}

function hrefToSlug(href: string): string[] {
    if (href === "/docs") {
        return []
    }

    if (!href.startsWith("/docs/")) {
        return []
    }

    return href.replace("/docs/", "").split("/").filter(Boolean)
}

function collectSlugs(items: DocsNavItem[]): string[][] {
    const output: string[][] = []

    for (const item of items) {
        if (item.href != null) {
            output.push(hrefToSlug(item.href))
        }

        if (item.items != null && item.items.length > 0) {
            output.push(...collectSlugs(item.items))
        }
    }

    return output
}

function getDocPathFromSlug(slug: string[]): string {
    if (slug.length === 0) {
        return path.join(DOCS_DIR, "index.mdx")
    }

    return path.join(DOCS_DIR, ...slug) + ".mdx"
}

function toHref(slug: string[]): string {
    if (slug.length === 0) {
        return "/docs"
    }

    return `/docs/${slug.join("/")}`
}

async function resolveDocPath(slug: string[]): Promise<string | null> {
    const hasTraversal = slug.some(segment => segment.includes(".."))
    if (hasTraversal) {
        return null
    }

    const normalized = normalizeSlug(slug)
    const docPath = getDocPathFromSlug(normalized)
    try {
        await readFile(docPath, "utf8")
        return docPath
    } catch {
        return null
    }
}

export const getAllDocSlugs = cache(async (): Promise<string[][]> => {
    const allSlugs = collectSlugs(docsNavigation)
    const deduped = new Map<string, string[]>()

    for (const slug of allSlugs) {
        deduped.set(slug.join("/"), slug)
    }

    return [...deduped.values()]
})

export const getDocMetaBySlug = cache(
    async (slug: string[]): Promise<DocsPageMeta | null> => {
        const docPath = await resolveDocPath(slug)
        if (!docPath) {
            return null
        }

        const file = await readFile(docPath, "utf8")
        const parsed = matter(file)
        const normalizedSlug = normalizeSlug(slug)

        return {
            slug: normalizedSlug,
            href: toHref(normalizedSlug),
            title:
                typeof parsed.data.title === "string"
                    ? parsed.data.title
                    : (normalizedSlug[normalizedSlug.length - 1] ?? "Untitled"),
            description:
                typeof parsed.data.description === "string"
                    ? parsed.data.description
                    : undefined,
        }
    },
)

export async function getDocBySlug(slug: string[]): Promise<DocsPage | null> {
    const normalizedSlug = normalizeSlug(slug)
    const docPath = await resolveDocPath(normalizedSlug)
    if (!docPath) {
        return null
    }

    const file = await readFile(docPath, "utf8")
    const parsed = matter(file)
    const title =
        typeof parsed.data.title === "string"
            ? parsed.data.title
            : (normalizedSlug[normalizedSlug.length - 1] ?? "Untitled")

    const description =
        typeof parsed.data.description === "string"
            ? parsed.data.description
            : undefined

    const { content } = await compileMDX({
        source: parsed.content,
        components: docsMdxComponents,
        options: {
            mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
            },
        },
    })

    return {
        slug: normalizedSlug,
        href: toHref(normalizedSlug),
        title,
        description,
        content,
        toc: extractToc(parsed.content),
    }
}
