"use client"

import type { ReactElement } from "react"

import * as Dialog from "@radix-ui/react-dialog"
import { useState } from "react"

import { Link } from "~/components/ui/link"
import { DocsNavItem } from "~/lib/docs/types"

import { DocsLogo } from "./docs-logo"
import { DocsNavLinks } from "./docs-nav-links"

function HamburgerIcon(): ReactElement {
    return (
        <span className="flex flex-col gap-1" aria-hidden>
            <span className="bg-primary block h-0.5 w-5" />
            <span className="bg-primary block h-0.5 w-5" />
            <span className="bg-primary block h-0.5 w-5" />
        </span>
    )
}

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
                    type="button"
                    className="svg-outline bg-secondary relative px-2 py-2"
                    aria-label="Open docs navigation"
                >
                    <HamburgerIcon />
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
                <Dialog.Content className="border-primary bg-secondary fixed top-0 right-0 z-50 flex h-dvh w-[85vw] max-w-sm translate-x-full flex-col border-l-2 p-3 transition-transform duration-200 data-[state=closed]:translate-x-full data-[state=open]:translate-x-0">
                    <div className="border-primary mb-4 flex items-center justify-between pb-3">
                        <DocsLogo />
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="svg-outline border-primary bg-secondary relative border-2 px-2 py-1 font-semibold"
                            >
                                Close
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <DocsNavLinks
                            items={items}
                            onNavigate={() => setOpen(false)}
                        />
                    </div>

                    <div className="mt-4 pt-4">
                        <Link href="/" onClick={() => setOpen(false)}>
                            Back to main site
                        </Link>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
