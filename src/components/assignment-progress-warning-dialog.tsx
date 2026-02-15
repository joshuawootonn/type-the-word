"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { XIcon } from "@phosphor-icons/react"
import { useMemo, useState } from "react"

import { Link } from "~/components/ui/link"
import toProperCase from "~/lib/toProperCase"

export interface AssignmentProgressWarning {
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

function buildReferenceLabel(assignment: AssignmentProgressWarning): string {
    const book = toProperCase(assignment.book.split("_").join(" "))
    const sameChapter = assignment.startChapter === assignment.endChapter
    const sameVerse =
        sameChapter && assignment.startVerse === assignment.endVerse

    const verseLabel = sameChapter
        ? `${assignment.startChapter}:${assignment.startVerse}${sameVerse ? "" : `-${assignment.endVerse}`}`
        : `${assignment.startChapter}:${assignment.startVerse}-${assignment.endChapter}:${assignment.endVerse}`

    return `${book} ${verseLabel}`
}

export function AssignmentProgressWarningDialog({
    assignment,
}: {
    assignment: AssignmentProgressWarning
}) {
    const [open, setOpen] = useState(true)
    const referenceLabel = useMemo(
        () => buildReferenceLabel(assignment),
        [assignment],
    )
    const assignmentHref = `/classroom/${encodeURIComponent(assignment.courseId)}/assignment/${encodeURIComponent(assignment.id)}`

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
                <Dialog.Content className="border-primary bg-secondary fixed top-1/2 left-1/2 z-50 w-[min(95vw,36rem)] -translate-x-1/2 -translate-y-1/2 border-2 p-5">
                    <Dialog.Close asChild>
                        <button
                            type="button"
                            className="svg-outline border-primary bg-secondary text-primary absolute top-0 right-0 border-2 p-1"
                            aria-label="Close assignment warning"
                        >
                            <XIcon aria-hidden size={18} weight="bold" />
                        </button>
                    </Dialog.Close>

                    <Dialog.Title className="text-primary text-xl font-semibold">
                        Assignment Progress Warning
                    </Dialog.Title>

                    <Dialog.Description className="text-primary mt-3">
                        You have an assignment for {referenceLabel} (
                        {assignment.translation.toUpperCase()}). Typing on this
                        page will not count toward your assignment score or
                        progress.
                    </Dialog.Description>

                    <p className="text-primary mt-3 text-sm opacity-80">
                        Assignment: {assignment.title}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={assignmentHref}>Go to assignment</Link>
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="svg-outline border-primary bg-secondary text-primary relative border-2 px-3 py-1 font-medium"
                            >
                                Continue here
                            </button>
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
