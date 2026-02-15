"use client"

import type { ReactElement } from "react"

import { ArrowLeftIcon, List, XIcon } from "@phosphor-icons/react"
import * as Dialog from "@radix-ui/react-dialog"
import { useState } from "react"

import { Link } from "~/components/ui/link"
import { DocsNavItem } from "~/lib/docs/types"

import { DocsLogo } from "./docs-logo"
import { DocsNavLinks } from "./docs-nav-links"

export function MobileSidebarDialog({
    items,
}: {
    items: DocsNavItem[]
}): ReactElement {
    const [open, setOpen] = useState(false)

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    className="svg-outline bg-secondary relative p-1"
                    aria-label="Open docs navigation"
                >
                    <List size={24} weight="regular" />
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
                <Dialog.Content className="bg-secondary fixed top-0 right-0 left-0 z-50 flex h-dvh max-w-screen flex-col p-4 transition-transform duration-200">
                    <div className="mb-4 flex items-center justify-between pb-3">
                        <DocsLogo />
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="svg-outline bg-secondary relative p-1"
                            >
                                <XIcon aria-hidden size={24} weight="regular" />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className="min-h-0 flex-1">
                        <DocsNavLinks
                            items={items}
                            onNavigate={() => setOpen(false)}
                        />
                    </div>
                    <div className="mt-4 pt-4">
                        <Link
                            href="/"
                            onClick={() => setOpen(false)}
                            variant="text"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeftIcon
                                aria-hidden
                                size={16}
                                weight="regular"
                            />{" "}
                            Back to main site
                        </Link>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
