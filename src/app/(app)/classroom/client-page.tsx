"use client"

import { useState } from "react"

import { Button } from "~/components/ui/button"
import { Link } from "~/components/ui/link"

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
    const [teacherError, setError] = useState<string | null>(initialError)
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

    const error = teacherError || studentError

    return (
        <>
            <h1>Google Classroom</h1>
            {error && (
                <div className="not-prose border-error bg-secondary mb-6 flex items-start gap-3 border-2 p-4">
                    <svg
                        className="text-error mt-1 h-5 w-5 shrink-0"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-error">{error}</p>
                </div>
            )}

            {!isConnected && (
                <>
                    <h2>Student Connection</h2>
                    <p>
                        Connect as a student to submit your assignments back to
                        Classroom.
                    </p>

                    {isStudentConnected && studentSuccess && (
                        <div className="border-success bg-secondary flex items-start gap-3 border-2 p-4">
                            <div className="text-success text-sm">
                                Student account connected successfully.
                            </div>
                        </div>
                    )}

                    {isStudentConnected ? (
                        <>
                            <div className="border-primary bg-secondary mb-3 flex items-center gap-4 border-2 p-4">
                                <svg
                                    className="text-success h-8 w-8"
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
                                    <div className="text-primary font-medium">
                                        Connected as Student
                                    </div>
                                    <div className="text-primary text-sm opacity-75">
                                        Your student account is linked and ready
                                        to submit assignments
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link href="/classroom/dashboard">
                                    View dashboard
                                </Link>
                                <Button
                                    onClick={() => {
                                        void handleStudentDisconnect()
                                    }}
                                    disabled={isStudentLoading}
                                >
                                    Disconnect Student Account
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div>
                            {isInitiallyAuthed ? (
                                <Button
                                    onClick={() => {
                                        void handleStudentConnect()
                                    }}
                                    disabled={isStudentLoading}
                                >
                                    {isStudentLoading ? (
                                        <>Connecting...</>
                                    ) : (
                                        <>Connect as Student</>
                                    )}
                                </Button>
                            ) : (
                                <Link href="/auth/login?callbackUrl=%2Fclassroom">
                                    Log in
                                </Link>
                            )}
                        </div>
                    )}
                </>
            )}

            {!isStudentConnected && (
                <>
                    <h2>Teacher Connection</h2>
                    <p>
                        Connect as a teacher to create assignments and track
                        student progress.
                    </p>

                    {isConnected && success && (
                        <div className="border-success bg-secondary flex items-start gap-3 border-2 p-4">
                            <div className="text-success text-sm">
                                Teacher account connected successfully.
                            </div>
                        </div>
                    )}

                    {isConnected ? (
                        <>
                            <div className="border-primary bg-secondary mb-3 flex items-center gap-4 border-2 p-4">
                                <svg
                                    className="text-success h-8 w-8"
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
                                    <div className="text-primary font-medium">
                                        Connected as teacher
                                    </div>
                                    <div className="text-primary text-sm text-pretty opacity-75">
                                        Your teacher account is linked. Create
                                        assigments or head to the dashboard to
                                        track how current assignments are going.
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link href="/classroom/assign">
                                    Create assignment
                                </Link>
                                <Link href="/classroom/dashboard">
                                    View dashboard
                                </Link>
                                <Button
                                    onClick={() => {
                                        void handleDisconnect()
                                    }}
                                    disabled={isLoading}
                                >
                                    Disconnect from Google Classroom
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div>
                            {isInitiallyAuthed ? (
                                <Button
                                    onClick={() => {
                                        void handleConnect()
                                    }}
                                    disabled={isLoading}
                                    loadingLabel="Connecting"
                                    isLoading={isLoading}
                                >
                                    Connect as Teacher
                                </Button>
                            ) : (
                                <Link href="/auth/login?callbackUrl=%2Fclassroom">
                                    Log in
                                </Link>
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    )
}
