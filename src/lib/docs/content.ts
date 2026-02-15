import matter from "gray-matter"
import { compileMDX } from "next-mdx-remote/rsc"
import { readdir, readFile } from "node:fs/promises"
import path from "path"
import { cache } from "react"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { docsMdxComponents } from "~/components/docs/mdx-components"

import { extractToc } from "./toc"
import { DocsPage, DocsPageMeta } from "./types"

const DOCS_DIR = path.join(process.cwd(), "content", "docs")

async function walkMdxFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const mdxFiles = await Promise.all(
        entries.map(async entry => {
            const entryPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                return walkMdxFiles(entryPath)
            }

            if (entry.isFile() && entry.name.endsWith(".mdx")) {
                return [entryPath]
            }

            return []
        }),
    )

    return mdxFiles.flat()
}

function normalizeSlugs(filePath: string): string[] {
    const relative = path
        .relative(DOCS_DIR, filePath)
        .replace(/\\/g, "/")
        .replace(/\.mdx$/, "")

    const parts = relative.split("/")
    if (parts[parts.length - 1] === "index") {
        return parts.slice(0, -1)
    }

    return parts
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

    const normalized = slug.filter(Boolean)
    if (normalized.length === 0) {
        const indexPath = path.join(DOCS_DIR, "index.mdx")
        try {
            await readFile(indexPath, "utf8")
            return indexPath
        } catch {
            return null
        }
    }

    const directPath = path.join(DOCS_DIR, ...normalized) + ".mdx"
    try {
        await readFile(directPath, "utf8")
        return directPath
    } catch {
        const nestedIndex = path.join(DOCS_DIR, ...normalized, "index.mdx")
        try {
            await readFile(nestedIndex, "utf8")
            return nestedIndex
        } catch {
            return null
        }
    }
}

const listDocFiles = cache(
    async (): Promise<string[]> => walkMdxFiles(DOCS_DIR),
)

export const getAllDocSlugs = cache(async (): Promise<string[][]> => {
    const files = await listDocFiles()
    return files.map(normalizeSlugs)
})

export const getDocMetaBySlug = cache(
    async (slug: string[]): Promise<DocsPageMeta | null> => {
        const docPath = await resolveDocPath(slug)
        if (!docPath) {
            return null
        }

        const file = await readFile(docPath, "utf8")
        const parsed = matter(file)
        const normalizedSlug = normalizeSlugs(docPath)

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
    const docPath = await resolveDocPath(slug)
    if (!docPath) {
        return null
    }

    const file = await readFile(docPath, "utf8")
    const parsed = matter(file)
    const normalizedSlug = normalizeSlugs(docPath)
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
