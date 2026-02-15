import { Metadata } from "next"
import { notFound } from "next/navigation"
import { ReactElement } from "react"

import { TocLinks } from "~/components/docs/toc-links"
import { Footer } from "~/components/footer"
import { getAllDocSlugs, getDocBySlug } from "~/lib/docs/content"

interface PageProps {
    params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params
    const page = await getDocBySlug(slug ?? [])

    if (!page) {
        return {}
    }

    return {
        title: page.title,
        description: page.description,
    }
}

export async function generateStaticParams(): Promise<
    Array<{ slug: string[] }>
> {
    const slugs = await getAllDocSlugs()
    return slugs.map(slug => ({ slug }))
}

export default async function Page({
    params,
}: PageProps): Promise<ReactElement> {
    const { slug } = await params
    const page = await getDocBySlug(slug ?? [])

    if (!page) {
        notFound()
    }

    return (
        <div className="flex gap-8 px-12 pt-12">
            <article className="max-w-page typo:prose dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary typo:prose-li:text-primary typo:prose-a:text-primary typo:prose-strong:text-primary typo:prose-code:text-primary container mx-auto w-full">
                <h1>{page.title}</h1>
                {page.description ? <p>{page.description}</p> : null}
                {page.content}
                <Footer className="mt-32" />
            </article>
            <TocLinks toc={page.toc} />
        </div>
    )
}
