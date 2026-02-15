"use client"

import type { ReactElement } from "react"

import { Backpack } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "~/lib/cn"
import { DocsNavIcon, DocsNavItem } from "~/lib/docs/types"

interface Props {
    items: DocsNavItem[]
    onNavigate?: () => void
}

const docsNavIcons: Record<DocsNavIcon, typeof Backpack> = {
    backpack: Backpack,
}

function NavItem({
    item,
    pathname,
    depth,
    onNavigate,
}: {
    item: DocsNavItem
    pathname: string
    depth: number
    onNavigate?: () => void
}): ReactElement {
    const hasChildren = Array.isArray(item.items) && item.items.length > 0
    const isActive = item.href != null && pathname === item.href
    const GroupIcon = item.icon != null ? docsNavIcons[item.icon] : null

    return (
        <li>
            {item.href ? (
                <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                        "svg-outline text-primary/70 relative block border-2 border-transparent px-2 py-1 text-sm no-underline",
                        isActive ? "bg-primary text-secondary" : undefined,
                    )}
                >
                    {item.title}
                </Link>
            ) : (
                <div
                    className={cn(
                        "mt-6 flex items-center gap-2 px-2 py-1 text-sm",
                    )}
                >
                    {GroupIcon != null ? (
                        <GroupIcon aria-hidden size={16} weight="regular" />
                    ) : null}
                    {item.title}
                </div>
            )}

            {hasChildren ? (
                <ul className="mt-1 space-y-1">
                    {item.items?.map(child => (
                        <NavItem
                            key={`${child.title}-${child.href ?? "group"}`}
                            item={child}
                            pathname={pathname}
                            depth={depth + 1}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            ) : null}
        </li>
    )
}

export function DocsNavLinks({ items, onNavigate }: Props): ReactElement {
    const pathname = usePathname() ?? ""

    return (
        <ul className="space-y-2">
            {items.map(item => (
                <NavItem
                    key={`${item.title}-${item.href ?? "group"}`}
                    item={item}
                    pathname={pathname}
                    depth={0}
                    onNavigate={onNavigate}
                />
            ))}
        </ul>
    )
}
