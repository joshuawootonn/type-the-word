"use client"

import { Field, Formik } from "formik"
import Link from "next/link"
import { useState, useRef } from "react"

import { Loading } from "~/components/loading"
import { cn } from "~/lib/cn"

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const emailRef = useRef<HTMLInputElement>(null)

    if (isSubmitted) {
        return (
            <div className="mt-8 flex min-h-screen items-start justify-center">
                <div className="w-full max-w-md text-center">
                    <h1 className="mb-4 text-3xl font-semibold text-primary">
                        Check your email
                    </h1>
                    <p className="mb-8 text-pretty text-primary">
                        If an account exists with that email address, we&apos;ve
                        sent you a password reset link.
                    </p>
                    <Link
                        href="/auth/login"
                        className="svg-outline relative inline-block border-2 border-primary bg-secondary px-3 py-1 font-semibold text-primary"
                    >
                        Back to log in
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-8 flex min-h-screen items-start justify-center">
            <div className="w-full max-w-md">
                <h1 className="mb-4 text-center text-3xl font-semibold text-primary">
                    Forgot your password?
                </h1>
                <p className="mb-8 text-pretty text-center text-primary">
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                </p>

                <Formik
                    initialValues={{ email: "" }}
                    validate={values => {
                        const errors: { email?: string } = {}
                        if (!values.email) {
                            errors.email = "Email is required"
                        } else if (
                            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                                values.email,
                            )
                        ) {
                            errors.email = "Invalid email address"
                        }

                        // Focus first field with error
                        if (errors.email && emailRef.current) {
                            emailRef.current.focus()
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
                                "/api/auth/forgot-password",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        email: values.email,
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
                                <div className="border-2 border-error bg-error/10 px-4 py-3 text-error">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block font-medium text-primary"
                                >
                                    Email
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="email"
                                        type="email"
                                        id="email"
                                        innerRef={emailRef}
                                        className="w-full rounded-none border-2 border-primary bg-secondary px-3 py-1.5 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Enter your email..."
                                        autoComplete="email"
                                    />
                                </div>
                                {props.errors.email &&
                                    props.submitCount > 0 && (
                                        <div className="mt-2 text-error">
                                            {props.errors.email}
                                        </div>
                                    )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="svg-outline relative w-full cursor-pointer border-2 border-primary bg-primary px-3 py-1 font-semibold text-secondary disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loading
                                            className={cn(
                                                "text-md absolute left-1/2 top-1/2 -translate-x-8 -translate-y-1/2 font-semibold",
                                                isLoading
                                                    ? "text-secondary"
                                                    : "text-primary",
                                            )}
                                        />

                                        <div className="h-6" />
                                    </>
                                ) : (
                                    "Send reset link"
                                )}
                            </button>
                        </form>
                    )}
                </Formik>

                <p className="mt-8 text-center text-primary">
                    Remember your password?{" "}
                    <Link
                        href="/auth/login"
                        className="svg-outline relative font-semibold underline hover:no-underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}
