import Link from "next/link"

import { CopyrightMetadata } from "~/lib/parseEsv"

type Props = {
    copyright: CopyrightMetadata
}

export function CopyrightCitation({ copyright }: Props) {
    const normalizedText = copyright.text.trim().replace(/\.?$/, ".")

    return (
        <p className="mt-16 !text-sm text-primary">
            ({copyright.abbreviation}) {normalizedText} Click{" "}
            <Link href="/copyright" className="text-primary underline">
                here
            </Link>{" "}
            for more copyright information.
        </p>
    )
}
