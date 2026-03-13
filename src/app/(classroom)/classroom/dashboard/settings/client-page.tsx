"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"
import { NumberInput } from "~/components/ui/number-input"
import { useToast } from "~/components/ui/toast"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"

import { fetchOrganizationSettings, saveOrganizationSettings } from "./actions"

export function ClientPage() {
    const queryClient = useQueryClient()
    const { showToast } = useToast()
    const [correctedAccuracyThreshold, setCorrectedAccuracyThreshold] =
        useState(90)
    const [regularAccuracyThreshold, setRegularAccuracyThreshold] = useState(30)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    const settingsQuery = useQuery({
        queryKey: ["classroom-organization-settings"],
        queryFn: fetchOrganizationSettings,
    })

    useEffect(() => {
        if (settingsQuery.data) {
            setCorrectedAccuracyThreshold(settingsQuery.data.accuracyThreshold)
            setRegularAccuracyThreshold(
                settingsQuery.data.regularAccuracyThreshold,
            )
        }
    }, [settingsQuery.data])

    const saveMutation = useMutation({
        mutationFn: (input: {
            accuracyThreshold: number
            regularAccuracyThreshold: number
        }) => saveOrganizationSettings(input),
        onSuccess: async data => {
            setStatusMessage(null)
            setCorrectedAccuracyThreshold(data.accuracyThreshold)
            setRegularAccuracyThreshold(data.regularAccuracyThreshold)
            showToast({
                variant: "success",
                message: "Settings saved.",
            })
            await queryClient.invalidateQueries({
                queryKey: ["classroom-organization-settings"],
            })
        },
        onError: error => {
            setStatusMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to save settings.",
            )
        },
    })

    const hasUnsavedChanges =
        settingsQuery.data != null &&
        (correctedAccuracyThreshold !== settingsQuery.data.accuracyThreshold ||
            regularAccuracyThreshold !==
                settingsQuery.data.regularAccuracyThreshold)

    useEffect(() => {
        if (!hasUnsavedChanges) {
            return
        }

        const warningMessage =
            "You have unsaved settings changes. Leave this page without saving?"

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            event.returnValue = warningMessage
        }

        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target
            if (!(target instanceof Element)) {
                return
            }

            const anchor = target.closest("a[href]")
            if (!(anchor instanceof HTMLAnchorElement)) {
                return
            }

            if (
                anchor.target === "_blank" ||
                anchor.hasAttribute("download") ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return
            }

            const href = anchor.getAttribute("href")
            if (!href || href.startsWith("#")) {
                return
            }

            const destination = new URL(anchor.href, window.location.href)
            const current = new URL(window.location.href)
            const isSameLocation =
                destination.pathname === current.pathname &&
                destination.search === current.search &&
                destination.hash === current.hash
            if (isSameLocation) {
                return
            }

            const shouldLeave = window.confirm(warningMessage)
            if (!shouldLeave) {
                event.preventDefault()
                event.stopPropagation()
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        document.addEventListener("click", handleDocumentClick, true)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
            document.removeEventListener("click", handleDocumentClick, true)
        }
    }, [hasUnsavedChanges])

    if (settingsQuery.isLoading) {
        return <Loading />
    }

    if (settingsQuery.isError || !settingsQuery.data) {
        return (
            <div className="not-prose border-error bg-secondary border-2 p-4">
                <p className="text-error">
                    {settingsQuery.error instanceof Error
                        ? settingsQuery.error.message
                        : "Failed to load settings."}
                </p>
            </div>
        )
    }

    const hasUnsavedChangesForForm =
        correctedAccuracyThreshold !== settingsQuery.data.accuracyThreshold ||
        regularAccuracyThreshold !== settingsQuery.data.regularAccuracyThreshold
    const isOrgTeacher = settingsQuery.data.isOrgTeacher
    const isSaveDisabled = saveMutation.isPending || !hasUnsavedChangesForForm
    const saveDisabledReason = saveMutation.isPending
        ? "Saving..."
        : "Nothing to save"

    return (
        <div>
            <nav className="not-prose mb-6 flex items-center justify-start text-sm">
                <Link href="/classroom/dashboard" variant="text">
                    Dashboard
                </Link>
                <span className="mx-2 opacity-50">/</span>
                <span>Settings</span>
            </nav>

            <h1>Settings</h1>
            <p>Set organization-wide settings</p>

            <h2>Assignment settings</h2>
            <form
                className="not-prose mt-6 w-full space-y-6"
                onSubmit={event => {
                    event.preventDefault()
                    setStatusMessage(null)
                    if (!isOrgTeacher) {
                        setStatusMessage(
                            "Only organization teachers can update settings.",
                        )
                        return
                    }
                    saveMutation.mutate({
                        accuracyThreshold: correctedAccuracyThreshold,
                        regularAccuracyThreshold,
                    })
                }}
            >
                <div className="flex w-full items-center justify-between gap-16">
                    <div>
                        <h3>Corrected accuracy threshold</h3>
                        <p className="mt-2 text-sm opacity-75">
                            The accuracy after they have corrected their
                            mistakes that is required for a verse to be counted
                            toward the assignment. This value is completely
                            within your students' control, so it should be
                            relatively high.
                        </p>
                        <p className="mt-2 text-sm">Recommended: 90%</p>
                    </div>
                    <NumberInput
                        id="accuracy-threshold"
                        label="Corrected threshold (%)"
                        min={0}
                        max={100}
                        step={5}
                        value={correctedAccuracyThreshold}
                        onValueChange={value => {
                            setStatusMessage(null)
                            setCorrectedAccuracyThreshold(value)
                        }}
                        className="w-auto shrink-0"
                        inputClassName="max-w-44"
                    />
                </div>

                <div className="flex w-full items-center justify-between gap-16">
                    <div>
                        <h3>Accuracy threshold</h3>
                        <p className="mt-2 text-sm opacity-75">
                            The accuracy required for a verse to be counted
                            toward the assignment. This value is less in the
                            students' control, especially if they are learning
                            to type, so this value should be lower than the
                            corrected accuracy threshold, but if a student is
                            spamming mistakes, this threshold can enforce them
                            to completely retype the verse.
                        </p>
                        <p className="mt-2 text-sm">Recommended: 30%</p>
                    </div>
                    <NumberInput
                        id="regular-accuracy-threshold"
                        label="Accuracy threshold (%)"
                        min={0}
                        max={100}
                        step={5}
                        value={regularAccuracyThreshold}
                        onValueChange={value => {
                            setStatusMessage(null)
                            setRegularAccuracyThreshold(value)
                        }}
                        className="w-auto shrink-0"
                        inputClassName="max-w-44"
                    />
                </div>

                {statusMessage ? (
                    <div
                        className={
                            saveMutation.isError
                                ? "border-error text-error bg-secondary border-2 p-3 text-sm"
                                : "border-success text-success bg-secondary border-2 p-3 text-sm"
                        }
                    >
                        {statusMessage}
                    </div>
                ) : null}

                <div className="flex justify-end gap-3 pt-6">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger
                                render={<span className="inline-flex" />}
                            >
                                <Button
                                    type="submit"
                                    disabled={isSaveDisabled}
                                    isLoading={saveMutation.isPending}
                                    loadingLabel="Saving"
                                    className={
                                        isSaveDisabled
                                            ? "pointer-events-none"
                                            : undefined
                                    }
                                >
                                    Save
                                </Button>
                            </TooltipTrigger>
                            {isSaveDisabled ? (
                                <TooltipContent>
                                    {saveDisabledReason}
                                </TooltipContent>
                            ) : null}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </form>
        </div>
    )
}
