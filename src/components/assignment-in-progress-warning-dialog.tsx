"use client"

import { XIcon } from "@phosphor-icons/react"
import { useMemo, useState } from "react"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "~/components/ui/dialog"
import { Link } from "~/components/ui/link"
import { formatReferenceLabel } from "~/lib/formatReferenceLabel"

export interface AssignmentInProgressWarning {
    id: string
    courseId: string
    title: string
    translation: string
    book: string
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
}

export function AssignmentInProgressWarningDialog({
    assignment,
}: {
    assignment: AssignmentInProgressWarning
}) {
    const [open, setOpen] = useState(true)
    const referenceLabel = useMemo(
        () => formatReferenceLabel(assignment),
        [assignment],
    )
    const assignmentHref = `/classroom/${encodeURIComponent(assignment.courseId)}/assignment/${encodeURIComponent(assignment.id)}`

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[min(95vw,36rem)]">
                <DialogClose
                    type="button"
                    className="svg-outline border-primary bg-secondary text-primary absolute top-0 right-0 border-2 p-1"
                    aria-label="Close assignment warning"
                >
                    <XIcon aria-hidden size={18} weight="bold" />
                </DialogClose>

                <DialogTitle>
                    Are you trying to complete an assignment?
                </DialogTitle>

                <DialogDescription>
                    Looks like you have a classroom assignment for{" "}
                    {referenceLabel} ({assignment.translation.toUpperCase()}).
                    To get credit for your work, type out these verses on the
                    assignment page.
                </DialogDescription>

                <p className="text-primary mt-3 text-sm opacity-80">
                    Assignment: {assignment.title}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={assignmentHref}>Open assignment</Link>
                </div>
            </DialogContent>
        </Dialog>
    )
}
