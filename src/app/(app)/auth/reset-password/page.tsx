"use client"

import { Field, Formik } from "formik"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useRef } from "react"

import { Loading } from "~/components/loading"
import { cn } from "~/lib/cn"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const token = searchParams?.get("token")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const passwordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)

    if (!token) {
        return (
            <div className="mt-8 flex min-h-screen items-start justify-center">
                <div className="w-full max-w-md text-center">
                    <h1 className="text-primary mb-4 text-3xl font-semibold">
                        Invalid reset link
                    </h1>
                    <p className="text-primary mb-8 text-pretty">
                        This password reset link is invalid or has expired.
                    </p>
                    <Link
                        href="/auth/forgot-password"
                        className="svg-outline border-primary bg-secondary text-primary hover:bg-primary hover:text-secondary relative inline-block border-2 px-3 py-1 font-semibold transition-colors"
                    >
                        Request new link
                    </Link>
                </div>
            </div>
        )
    }

    if (isSubmitted) {
        return (
            <div className="mt-8 flex min-h-screen items-start justify-center">
                <div className="w-full max-w-md text-center">
                    <h1 className="text-primary mb-4 text-3xl font-semibold">
                        Password reset successful
                    </h1>
                    <p className="text-primary mb-8 text-pretty">
                        Your password has been reset. You can now log in with
                        your new password.
                    </p>
                    <Link
                        href="/auth/login"
                        className="svg-outline border-primary bg-primary text-secondary relative inline-block border-2 px-3 py-1 font-semibold"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-8 flex min-h-screen items-start justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-primary mb-4 text-center text-3xl font-semibold">
                    Reset your password
                </h1>
                <p className="text-primary mb-8 text-center">
                    Enter your new password below.
                </p>

                <Formik
                    initialValues={{ password: "", confirmPassword: "" }}
                    validate={values => {
                        const errors: {
                            password?: string
                            confirmPassword?: string
                        } = {}

                        if (!values.password) {
                            errors.password = "Password is required"
                        } else if (values.password.length < 8) {
                            errors.password =
                                "Password must be at least 8 characters"
                        } else if (!/[A-Z]/.test(values.password)) {
                            errors.password =
                                "Password must contain at least one uppercase letter"
                        } else if (
                            !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
                                values.password,
                            )
                        ) {
                            errors.password =
                                "Password must contain at least one special character"
                        }

                        if (!values.confirmPassword) {
                            errors.confirmPassword =
                                "Please confirm your password"
                        } else if (values.password !== values.confirmPassword) {
                            errors.confirmPassword = "Passwords do not match"
                        }

                        // Focus first field with error
                        if (errors.password && passwordRef.current) {
                            passwordRef.current.focus()
                        } else if (
                            errors.confirmPassword &&
                            confirmPasswordRef.current
                        ) {
                            confirmPasswordRef.current.focus()
                        }

                        return errors
                    }}
                    validateOnChange={false}
                    validateOnBlur={false}
                    onSubmit={async (values, { setSubmitting }) => {
                        setError(null)
                        setIsLoading(true)

                        try {
                            const response = await fetch(
                                "/api/auth/reset-password",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
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
                                setError(data.error ?? "An error occurred")
                                setIsLoading(false)
                                setSubmitting(false)
                                return
                            }

                            // Keep loading state true during transition to success screen
                            setIsSubmitted(true)
                        } catch (_) {
                            setError("An error occurred. Please try again.")
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
                                <div className="border-error bg-error/10 text-error border-2 px-4 py-3">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="password"
                                    className="text-primary mb-2 block font-medium"
                                >
                                    New Password
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="password"
                                        type="password"
                                        id="password"
                                        innerRef={passwordRef}
                                        className="border-primary bg-secondary text-primary placeholder:text-primary/50 w-full rounded-none border-2 px-3 py-1.5 font-medium outline-hidden"
                                        placeholder="Enter new password..."
                                        autoComplete="new-password"
                                    />
                                </div>
                                {props.errors.password &&
                                    props.submitCount > 0 && (
                                        <div className="text-error mt-2">
                                            {props.errors.password}
                                        </div>
                                    )}
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="text-primary mb-2 block font-medium"
                                >
                                    Confirm New Password
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="confirmPassword"
                                        type="password"
                                        id="confirmPassword"
                                        innerRef={confirmPasswordRef}
                                        className="border-primary bg-secondary text-primary placeholder:text-primary/50 w-full rounded-none border-2 px-3 py-1.5 font-medium outline-hidden"
                                        placeholder="Confirm new password..."
                                        autoComplete="new-password"
                                    />
                                </div>
                                {props.errors.confirmPassword &&
                                    props.submitCount > 0 && (
                                        <div className="text-error mt-2">
                                            {props.errors.confirmPassword}
                                        </div>
                                    )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="svg-outline border-primary bg-primary text-secondary relative w-full cursor-pointer border-2 px-3 py-1 font-semibold disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loading
                                            className={cn(
                                                "text-md absolute top-1/2 left-1/2 -translate-x-8 -translate-y-1/2 font-semibold",
                                                isLoading
                                                    ? "text-secondary"
                                                    : "text-primary",
                                            )}
                                        />

                                        <div className="h-6" />
                                    </>
                                ) : (
                                    "Reset password"
                                )}
                            </button>
                        </form>
                    )}
                </Formik>
            </div>
        </div>
    )
}
