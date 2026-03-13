"use client"

import { XIcon } from "@phosphor-icons/react"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "~/components/ui/dialog"

type AccuracyWarning = {
    title: string
    description: string
}

export function AssignmentAccuracyThresholdWarningDialog({
    warning,
    setWarning,
    onTryAgain,
}: {
    warning: AccuracyWarning | null
    setWarning: (warning: AccuracyWarning | null) => void
    onTryAgain: () => void
}) {
    return (
        <Dialog
            open={warning != null}
            onOpenChange={nextOpen => {
                if (!nextOpen) {
                    setWarning(null)
                    onTryAgain()
                }
            }}
        >
            <DialogContent className="w-[min(95vw,32rem)]" initialFocus={false}>
                <DialogClose
                    type="button"
                    className="svg-outline border-primary bg-secondary text-primary absolute top-0 right-0 translate-x-0.5 -translate-y-0.5 border-2 p-1"
                    aria-label="Close accuracy warning"
                >
                    <XIcon aria-hidden size={18} weight="bold" />
                </DialogClose>

                <DialogTitle>{warning?.title}</DialogTitle>
                <DialogDescription>{warning?.description}</DialogDescription>

                <div className="mt-5 flex justify-end">
                    <DialogClose className="svg-outline border-primary bg-secondary px-3 py-1 font-semibold">
                        Try again
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    )
}
