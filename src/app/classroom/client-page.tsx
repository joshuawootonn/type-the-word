"use client"

import Link from "next/link"
import { useState } from "react"

import { disconnectClassroom, initiateOAuthConnection } from "./actions"

interface ClientPageProps {
    initialIsConnected: boolean
    initialSuccess: boolean
    initialError: string | null
    isInitiallyAuthed: boolean
}

export function ClientPage({
    initialIsConnected,
    initialSuccess,
    initialError,
    isInitiallyAuthed,
}: ClientPageProps) {
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(initialError)
    const [success, setSuccess] = useState(initialSuccess)

    async function handleConnect() {
        setIsLoading(true)
        setError(null)

        try {
            const authUrl = await initiateOAuthConnection()
            // Redirect to Google OAuth
            window.location.href = authUrl
        } catch (_) {
            setError("Failed to initiate connection")
            setIsLoading(false)
        }
    }

    async function handleDisconnect() {
        if (!confirm("Are you sure you want to disconnect Google Classroom?")) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await disconnectClassroom()
            setIsConnected(false)
            setSuccess(false)
        } catch (_) {
            setError("Failed to disconnect")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <h1 className="text-3xl font-semibold text-primary">
                Google Classroom
            </h1>
            {error && (
                <div className="mb-6 flex items-start gap-3 border-2 border-error bg-secondary p-4">
                    <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-error"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-error">{error}</div>
                </div>
            )}

            {isConnected ? (
                <div className="space-y-6">
                    {success && (
                        <div className="flex items-start gap-3 border-2 border-success bg-secondary p-4">
                            <div className="text-sm text-success">
                                Successfully connected to Google Classroom!
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 border-2 border-primary bg-secondary p-4">
                        <svg
                            className="h-8 w-8 text-success"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                            <div className="font-medium text-primary">
                                Connected to Google Classroom
                            </div>
                            <div className="text-sm text-primary opacity-75">
                                Your account is linked and ready to use
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="mb-4 text-primary">
                            Create assignments and track student progress across
                            your courses.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/classroom/assign"
                                className="svg-outline relative inline-flex items-center gap-2 border-2 border-primary bg-secondary px-3 py-1 font-medium text-primary no-underline"
                            >
                                Create Assignment
                            </Link>
                            <Link
                                href="/classroom/dashboard"
                                className="svg-outline relative inline-flex items-center gap-2 border-2 border-primary bg-secondary px-3 py-1 font-medium text-primary no-underline"
                            >
                                View Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="border-t-2 border-primary pt-6">
                        <button
                            onClick={() => {
                                void handleDisconnect()
                            }}
                            disabled={isLoading}
                            className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary no-underline"
                        >
                            Disconnect Google Classroom
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <p className="text-primary">
                            Connect your Google Classroom account to create
                            assignments and track student progress.
                        </p>
                    </div>

                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
                        Features
                    </h2>
                    <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-3">
                            Create typing assignments for your courses
                        </li>
                        <li className="flex items-start gap-3">
                            Assign Bible passages for students to type
                        </li>
                        <li className="flex items-start gap-3">
                            Track student progress and completion
                        </li>
                        <li className="flex items-start gap-3">
                            Automatically sync grades to Classroom
                        </li>
                    </ol>

                    <div>
                        {isInitiallyAuthed ? (
                            <button
                                onClick={() => {
                                    void handleConnect()
                                }}
                                disabled={isLoading}
                                className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary no-underline"
                            >
                                {isLoading ? (
                                    <>Connecting...</>
                                ) : (
                                    <>Connect with Google</>
                                )}
                            </button>
                        ) : (
                            <Link
                                href="/auth/login?callbackUrl=%2Fclassroom"
                                className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary no-underline"
                            >
                                Log in
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
