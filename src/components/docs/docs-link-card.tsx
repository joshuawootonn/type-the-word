import type { ReactElement, ReactNode } from "react"

import NextLink from "next/link"

interface DocsLinkCardProps {
    href: string
    title: string
    description: string
    children: ReactNode
}

export function DocsLinkGrid({
    children,
}: {
    children: ReactNode
}): ReactElement {
    return (
        <div className="not-prose grid grid-cols-1 gap-4 md:grid-cols-2">
            {children}
        </div>
    )
}

export function DocsLinkCard({
    href,
    title,
    description,
    children,
}: DocsLinkCardProps): ReactElement {
    const isExternal = href.startsWith("http://") || href.startsWith("https://")

    return (
        <NextLink
            href={href}
            className="svg-outline bg-secondary relative block no-underline"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
        >
            <div className="border-primary bg-primary/3 relative border-2 p-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-50"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, oklch(var(--oklch-primary) / 0.18) 1px, transparent 1px), linear-gradient(to bottom, oklch(var(--oklch-primary) / 0.18) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
                <div className="[&>svg]:text-primary relative mx-auto flex h-24 w-24 items-center justify-center [&>svg]:size-12">
                    {children}
                </div>
            </div>
            <div className="py-4">
                <h3 className="text-primary m-0 text-xl font-semibold">
                    {title}
                </h3>
                <p className="text-primary/70 mt-2 mb-0 text-base">
                    {description}
                </p>
            </div>
        </NextLink>
    )
}
