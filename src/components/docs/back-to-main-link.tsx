"use client"

import type { ReactElement } from "react"

import { ArrowLeftIcon } from "@phosphor-icons/react"

import { Link } from "~/components/ui/link"

export function BackToMainLink(): ReactElement {
    return (
        <Link
            href="/"
            variant="text"
            className="inline-flex items-center gap-1"
        >
            <ArrowLeftIcon aria-hidden size={16} weight="regular" />
            Back to main site
        </Link>
    )
}
