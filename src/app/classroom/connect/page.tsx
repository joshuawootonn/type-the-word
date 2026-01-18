'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

type AuthResponse = {
    connected: boolean
    authenticated: boolean
    googleId?: string
    authUrl?: string
    error?: string
}

export default function ClassroomConnectPage() {
    const { data: session, status } = useSession()
    const searchParams = useSearchParams()
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const success = searchParams?.get('success')
    const errorParam = searchParams?.get('error')

    useEffect(() => {
        if (errorParam) {
            setError(
                errorParam === 'no_code'
                    ? 'Authorization was cancelled'
                    : errorParam === 'token_exchange_failed'
                      ? 'Failed to connect to Google Classroom'
                      : `Error: ${errorParam}`,
            )
        }
    }, [errorParam])

    useEffect(() => {
        async function checkConnection() {
            if (status === 'loading') return
            if (!session?.user) {
                setIsLoading(false)
                return
            }

            try {
                const response = await fetch('/api/classroom/auth')
                const data: AuthResponse = await response.json()
                setIsConnected(data.connected)
            } catch {
                setError('Failed to check connection status')
            } finally {
                setIsLoading(false)
            }
        }

        void checkConnection()
    }, [session, status])

    const handleConnect = () => {
        setIsConnecting(true)
        setError(null)

        fetch('/api/classroom/auth', { method: 'POST' })
            .then(response => response.json())
            .then((data: AuthResponse) => {
                if (data.authUrl) {
                    window.location.href = data.authUrl
                } else {
                    setError('Failed to get authorization URL')
                    setIsConnecting(false)
                }
            })
            .catch(() => {
                setError('Failed to initiate connection')
                setIsConnecting(false)
            })
    }

    const handleDisconnect = () => {
        setIsLoading(true)
        setError(null)

        fetch('/api/classroom/disconnect', { method: 'POST' })
            .then(() => {
                setIsConnected(false)
            })
            .catch(() => {
                setError('Failed to disconnect')
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    if (status === 'loading' || isLoading) {
        return (
            <div>
                <h1>Google Classroom</h1>
                <p>Loading...</p>
            </div>
        )
    }

    if (!session?.user) {
        return (
            <div>
                <h1>Google Classroom</h1>
                <p>
                    Please{' '}
                    <Link href="/auth/login?callbackUrl=/classroom/connect">
                        sign in
                    </Link>{' '}
                    to connect your Google Classroom account.
                </p>
            </div>
        )
    }

    return (
        <div>
            <h1>Google Classroom Integration</h1>

            {success && (
                <div className="mb-4 rounded border-2 border-green-500 bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                    Successfully connected to Google Classroom!
                </div>
            )}

            {error && (
                <div className="mb-4 rounded border-2 border-red-500 bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <p>
                Connect your Google Classroom account to assign Bible typing
                passages to your students and track their progress.
            </p>

            <h2>How it works</h2>
            <ol className="list-decimal space-y-2 pl-6">
                <li>Connect your Google Classroom account below</li>
                <li>Select a passage and choose which class to assign it to</li>
                <li>
                    Students click the assignment link and type the passage on
                    Type the Word
                </li>
                <li>
                    View student progress including completion rate, WPM, and
                    accuracy
                </li>
                <li>
                    Grades are automatically synced back to Google Classroom
                </li>
            </ol>

            <div className="my-8">
                {isConnected ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>Connected to Google Classroom</span>
                        </div>

                        <div className="flex gap-4">
                            <Link
                                href="/classroom/assign"
                                className="svg-outline relative border-2 border-primary px-4 py-2 font-medium text-primary no-underline"
                            >
                                Assign a Passage
                            </Link>

                            <button
                                onClick={handleDisconnect}
                                className="border-2 border-gray-300 px-4 py-2 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="svg-outline relative border-2 border-primary px-4 py-2 font-medium text-primary disabled:opacity-50"
                    >
                        {isConnecting
                            ? 'Connecting...'
                            : 'Connect Google Classroom'}
                    </button>
                )}
            </div>

            <h2>Privacy & Permissions</h2>
            <p>When you connect, Type the Word will request permission to:</p>
            <ul className="list-disc space-y-1 pl-6">
                <li>View your courses where you are a teacher</li>
                <li>Create and manage assignments in your courses</li>
                <li>View student roster information</li>
                <li>Submit grades for assignments</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                We only access data necessary for the integration and never
                share your information with third parties. You can disconnect at
                any time.
            </p>
        </div>
    )
}
