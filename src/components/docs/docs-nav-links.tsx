"use client"

import type { ReactElement } from "react"

import { Backpack } from "@phosphor-icons/react"
import { CaretRight } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "~/lib/cn"
import { DocsNavIcon, DocsNavItem } from "~/lib/docs/types"

interface Props {
    items: DocsNavItem[]
    onNavigate?: () => void
}

const docsNavIcons: Record<DocsNavIcon, typeof Backpack> = {
    backpack: Backpack,
}

function containsPath(item: DocsNavItem, pathname: string): boolean {
    if (item.href === pathname) {
        return true
    }

    if (item.items == null || item.items.length === 0) {
        return false
    }

    return item.items.some(child => containsPath(child, pathname))
}

function NavItem({
    item,
    pathname,
    onNavigate,
}: {
    item: DocsNavItem
    pathname: string
    onNavigate?: () => void
}): ReactElement {
    const hasChildren = Array.isArray(item.items) && item.items.length > 0
    const isActive = item.href != null && pathname === item.href
    const GroupIcon = item.icon != null ? docsNavIcons[item.icon] : null
    const hasActiveDescendant =
        hasChildren &&
        item.items?.some(child => containsPath(child, pathname)) === true
    const shouldExpand = isActive || hasActiveDescendant
    const [isSectionOpen, setIsSectionOpen] = useState<boolean>(shouldExpand)

    useEffect(() => {
        if (shouldExpand) {
            setIsSectionOpen(true)
        }
    }, [shouldExpand])

    const childItems = hasChildren ? (
        <ul className="mt-1 space-y-1 pl-1">
            {item.items?.map(child => (
                <NavItem
                    key={`${child.title}-${child.href ?? "group"}`}
                    item={child}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
            ))}
        </ul>
    ) : null

    return (
        <li>
            {item.href ? (
                <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                        "svg-outline text-primary/70 relative flex items-center gap-2 border-2 border-transparent px-2 py-1 text-sm no-underline",
                        isActive ? "bg-primary/5 text-primary" : undefined,
                    )}
                >
                    {GroupIcon != null ? (
                        <GroupIcon aria-hidden size={16} weight="regular" />
                    ) : null}
                    {item.title}
                </Link>
            ) : hasChildren ? (
                <details
                    className="group/nav-section"
                    open={isSectionOpen}
                    onToggle={event =>
                        setIsSectionOpen(event.currentTarget.open)
                    }
                >
                    <summary className="svg-outline-sm text-primary/70 relative flex cursor-pointer list-none items-center gap-2 px-2 py-1 text-sm no-underline select-none [&::-webkit-details-marker]:hidden">
                        {GroupIcon != null ? (
                            <GroupIcon aria-hidden size={16} weight="regular" />
                        ) : null}
                        <span>{item.title}</span>
                        <CaretRight
                            aria-hidden
                            size={14}
                            weight="bold"
                            className="ml-auto transition-transform duration-50 group-open/nav-section:rotate-90"
                        />
                    </summary>
                    {childItems}
                </details>
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

            {item.href ? childItems : null}
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
                    onNavigate={onNavigate}
                />
            ))}
        </ul>
    )
}
