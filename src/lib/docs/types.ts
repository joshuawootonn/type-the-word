import { ReactElement } from "react"

export interface TocItem {
    id: string
    text: string
    level: 2 | 3
}

export interface DocsPage {
    slug: string[]
    href: string
    title: string
    description?: string
    content: ReactElement
    toc: TocItem[]
}

export interface DocsPageMeta {
    slug: string[]
    href: string
    title: string
    description?: string
}

export type DocsNavIcon = "backpack"

export interface DocsNavItem {
    title: string
    href?: string
    icon?: DocsNavIcon
    items?: DocsNavItem[]
}
