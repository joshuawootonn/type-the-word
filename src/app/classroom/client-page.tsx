"use client"

import Link from "next/link"
import { useState } from "react"

import {
    disconnectClassroom,
    disconnectStudentClassroom,
    initiateOAuthConnection,
    initiateStudentOAuthConnection,
} from "./actions"

interface ClientPageProps {
    initialIsConnected: boolean
    initialSuccess: boolean
    initialError: string | null
    initialStudentConnected: boolean
    initialStudentSuccess: boolean
    initialStudentError: string | null
    isInitiallyAuthed: boolean
}

export function ClientPage({
    initialIsConnected,
    initialSuccess,
    initialError,
    initialStudentConnected,
    initialStudentSuccess,
    initialStudentError,
    isInitiallyAuthed,
}: ClientPageProps) {
    const [isConnected, setIsConnected] = useState(initialIsConnected)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(initialError)
    const [success, setSuccess] = useState(initialSuccess)
    const [isStudentConnected, setIsStudentConnected] = useState(
        initialStudentConnected,
    )
    const [isStudentLoading, setIsStudentLoading] = useState(false)
    const [studentError, setStudentError] = useState<string | null>(
        initialStudentError,
    )
    const [studentSuccess, setStudentSuccess] = useState(initialStudentSuccess)

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

    async function handleStudentConnect() {
        setIsStudentLoading(true)
        setStudentError(null)

        try {
            const authUrl = await initiateStudentOAuthConnection()
            window.location.href = authUrl
        } catch (_) {
            setStudentError("Failed to initiate student connection")
            setIsStudentLoading(false)
        }
    }

    async function handleStudentDisconnect() {
        if (
            !confirm(
                "Are you sure you want to disconnect your student Google Classroom account?",
            )
        ) {
            return
        }

        setIsStudentLoading(true)
        setStudentError(null)

        try {
            await disconnectStudentClassroom()
            setIsStudentConnected(false)
            setStudentSuccess(false)
        } catch (_) {
            setStudentError("Failed to disconnect student account")
        } finally {
            setIsStudentLoading(false)
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
            {studentError && (
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
                    <div className="text-sm text-error">{studentError}</div>
                </div>
            )}

            <div className="not-prose space-y-10">
                <div className="space-y-6 border-2 border-primary bg-secondary p-6">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-primary">
                            Teacher Connection
                        </h2>
                        <p className="text-sm text-primary">
                            Connect as a teacher to create assignments and track
                            student progress.
                        </p>
                    </div>

                    {isConnected && success && (
                        <div className="flex items-start gap-3 border-2 border-success bg-secondary p-4">
                            <div className="text-sm text-success">
                                Teacher account connected successfully.
                            </div>
                        </div>
                    )}

                    {isConnected ? (
                        <>
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
                                        Connected as Teacher
                                    </div>
                                    <div className="text-sm text-primary opacity-75">
                                        Your teacher account is linked and ready
                                        to use
                                    </div>
                                </div>
                            </div>

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

                            <div className="border-t-2 border-primary pt-6">
                                <button
                                    onClick={() => {
                                        void handleDisconnect()
                                    }}
                                    disabled={isLoading}
                                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary no-underline"
                                >
                                    Disconnect Teacher Account
                                </button>
                            </div>
                        </>
                    ) : (
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
                                        <>Connect as Teacher</>
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
                    )}
                </div>

                <div className="space-y-6 border-2 border-primary bg-secondary p-6">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-primary">
                            Student Connection
                        </h2>
                        <p className="text-sm text-primary">
                            Connect as a student to submit your assignments back
                            to Classroom.
                        </p>
                    </div>

                    {isStudentConnected && studentSuccess && (
                        <div className="flex items-start gap-3 border-2 border-success bg-secondary p-4">
                            <div className="text-sm text-success">
                                Student account connected successfully.
                            </div>
                        </div>
                    )}

                    {isStudentConnected ? (
                        <>
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
                                        Connected as Student
                                    </div>
                                    <div className="text-sm text-primary opacity-75">
                                        Your student account is linked and ready
                                        to submit assignments
                                    </div>
                                </div>
                            </div>

                            <div className="border-t-2 border-primary pt-6">
                                <button
                                    onClick={() => {
                                        void handleStudentDisconnect()
                                    }}
                                    disabled={isStudentLoading}
                                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary no-underline"
                                >
                                    Disconnect Student Account
                                </button>
                            </div>
                        </>
                    ) : (
                        <div>
                            {isInitiallyAuthed ? (
                                <button
                                    onClick={() => {
                                        void handleStudentConnect()
                                    }}
                                    disabled={isStudentLoading}
                                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold text-primary no-underline"
                                >
                                    {isStudentLoading ? (
                                        <>Connecting...</>
                                    ) : (
                                        <>Connect as Student</>
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
                    )}
                </div>
            </div>
        </>
    )
}
