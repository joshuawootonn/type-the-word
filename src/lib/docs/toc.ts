import GithubSlugger from "github-slugger"

import { TocItem } from "./types"

const headingPattern = /^(#{2,3})\s+(.+?)\s*$/

function stripInlineMarkdown(value: string): string {
    return value
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~]/g, "")
        .replace(/<[^>]+>/g, "")
        .trim()
}

export function extractToc(content: string): TocItem[] {
    const lines = content.split("\n")
    const slugger = new GithubSlugger()
    const toc: TocItem[] = []
    let inCodeFence = false

    for (const line of lines) {
        if (line.trim().startsWith("```")) {
            inCodeFence = !inCodeFence
            continue
        }

        if (inCodeFence) {
            continue
        }

        const match = headingPattern.exec(line)
        if (!match) {
            continue
        }

        const hashes = match[1]
        const rawText = match[2]
        if (!hashes || !rawText) {
            continue
        }

        const level = hashes.length as 2 | 3
        const text = stripInlineMarkdown(rawText)
        if (text.length === 0) {
            continue
        }

        toc.push({
            id: slugger.slug(text),
            text,
            level,
        })
    }

    return toc
}
