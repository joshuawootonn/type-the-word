'use client'

import { Field, Formik } from 'formik'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loading } from '~/components/loading'
import { cn } from '~/lib/cn'

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const token = searchParams?.get('token')
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    if (!token) {
        return (
            <div className="flex min-h-screen items-start justify-center mt-8">
                <div className="w-full max-w-md text-center">
                    <h1 className="mb-4 text-3xl font-semibold text-primary">
                        Invalid reset link
                    </h1>
                    <p className="mb-8 text-primary">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link
                        href="/auth/forgot-password"
                        className="svg-outline relative inline-block border-2 border-primary bg-secondary px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary hover:text-secondary"
                    >
                        Request new link
                    </Link>
                </div>
            </div>
        )
    }

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-start justify-center mt-8">
                <div className="w-full max-w-md text-center">
                    <h1 className="mb-4 text-3xl font-semibold text-primary">
                        Password reset successful
                    </h1>
                    <p className="mb-8 text-primary">
                        Your password has been reset. You can now log in with
                        your new password.
                    </p>
                    <Link
                        href="/auth/login"
                        className="svg-outline relative inline-block border-2 border-primary bg-primary px-6 py-3 font-semibold text-secondary"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-start justify-center mt-8">
            <div className="w-full max-w-md">
                <h1 className="mb-4 text-center text-3xl font-semibold text-primary">
                    Reset your password
                </h1>
                <p className="mb-8 text-center text-primary">
                    Enter your new password below.
                </p>

                <Formik
                    initialValues={{ password: '', confirmPassword: '' }}
                    validate={values => {
                        const errors: {
                            password?: string
                            confirmPassword?: string
                        } = {}

                        if (!values.password) {
                            errors.password = 'Password is required'
                        } else if (values.password.length < 8) {
                            errors.password =
                                'Password must be at least 8 characters'
                        } else if (!/[A-Z]/.test(values.password)) {
                            errors.password =
                                'Password must contain at least one uppercase letter'
                        } else if (
                            !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                                values.password,
                            )
                        ) {
                            errors.password =
                                'Password must contain at least one special character'
                        }

                        if (!values.confirmPassword) {
                            errors.confirmPassword =
                                'Please confirm your password'
                        } else if (values.password !== values.confirmPassword) {
                            errors.confirmPassword = 'Passwords do not match'
                        }

                        return errors
                    }}
                    onSubmit={async (values, { setSubmitting }) => {
                        setError(null)
                        setIsLoading(true)

                        try {
                            const response = await fetch(
                                '/api/auth/reset-password',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        token,
                                        password: values.password,
                                    }),
                                },
                            )

                            const data: {
                                error?: string
                                success?: boolean
                            } = await response.json()

                            if (!response.ok) {
                                setError(data.error ?? 'An error occurred')
                                setIsLoading(false)
                                setSubmitting(false)
                                return
                            }

                            // Keep loading state true during transition to success screen
                            setIsSubmitted(true)
                        } catch (err) {
                            setError('An error occurred. Please try again.')
                            setIsLoading(false)
                            setSubmitting(false)
                        }
                    }}
                >
                    {props => (
                        <form
                            onSubmit={props.handleSubmit}
                            className="space-y-6"
                        >
                            {error && (
                                <div className="border-2 border-error bg-error/10 px-4 py-3 text-error">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block font-medium text-primary"
                                >
                                    New Password
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="password"
                                        type="password"
                                        id="password"
                                        className="w-full rounded-none border-2 border-primary bg-secondary p-3 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                                {props.errors.password && props.submitCount > 0 && (
                                    <div className="mt-2 text-error">
                                        {props.errors.password}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block font-medium text-primary"
                                >
                                    Confirm New Password
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="confirmPassword"
                                        type="password"
                                        id="confirmPassword"
                                        className="w-full rounded-none border-2 border-primary bg-secondary p-3 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                    />
                                </div>
                                {props.errors.confirmPassword && props.submitCount > 0 && (
                                    <div className="mt-2 text-error">
                                        {props.errors.confirmPassword}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="svg-outline relative w-full cursor-pointer border-2 border-primary bg-primary px-4 py-3 font-semibold text-secondary disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loading
                                            className={cn(
                                                'text-md absolute left-1/2 top-1/2 -translate-x-8 -translate-y-1/2 font-semibold',
                                                isLoading
                                                    ? 'text-secondary'
                                                    : 'text-primary',
                                            )}
                                        />

                                        <div className="h-6" />
                                    </>
                                ) : (
                                    'Reset password'
                                )}
                            </button>
                        </form>
                    )}
                </Formik>
            </div>
        </div>
    )
}
