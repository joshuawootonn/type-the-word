import type { ReactElement, ReactNode } from "react"

import type { TocItem } from "~/lib/docs/types"

import { TocLinks } from "~/components/docs/toc-links"

import { Footer } from "../footer"

interface DocsPageProps {
    title: string
    description: string
    toc: unknown
    children: ReactNode
}

interface ExtractedTocItem {
    value: string
    depth: number
    id?: string
    children?: ExtractedTocItem[]
}

function toFlatToc(toc: unknown): TocItem[] {
    if (!Array.isArray(toc)) {
        return []
    }

    const output: TocItem[] = []
    const queue: ExtractedTocItem[] = toc.filter(
        (item): item is ExtractedTocItem =>
            typeof item === "object" &&
            item != null &&
            "value" in item &&
            "depth" in item,
    )

    while (queue.length > 0) {
        const current = queue.shift()
        if (current == null) {
            continue
        }

        if (
            current.id != null &&
            typeof current.id === "string" &&
            current.id.length > 0 &&
            (current.depth === 2 || current.depth === 3)
        ) {
            output.push({
                id: current.id,
                text: current.value,
                level: current.depth,
            })
        }

        if (Array.isArray(current.children) && current.children.length > 0) {
            queue.unshift(...current.children)
        }
    }

    return output
}

export function DocsPage({
    title,
    description,
    toc,
    children,
}: DocsPageProps): ReactElement {
    const normalizedToc = toFlatToc(toc)

    return (
        <div className="flex gap-8 px-4 md:px-12">
            <article
                data-doc-article
                className="min-h-screen-1px pt-12 flex flex-col max-w-page typo:prose dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary typo:prose-li:text-primary typo:prose-a:text-primary typo:prose-strong:text-primary typo:prose-code:text-primary container mx-auto w-full"
            >
                <h1>{title}</h1>
                <p>{description}</p>
                <div className="grow">{children}</div>
                <Footer variant="docs" />
            </article>
            <TocLinks toc={normalizedToc} />
        </div>
    )
}
