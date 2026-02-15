"use client"

import clsx from "clsx"
import { Field, Formik } from "formik"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"

import { Loading } from "~/components/loading"
import { cn } from "~/lib/cn"

export default function LogInPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams?.get("callbackUrl") ?? "/"
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const errorParam = searchParams?.get("error")
        if (errorParam === "OAuthAccountNotLinked") {
            setError(
                "This email is already registered with a password. Please sign in with your email and password instead of Google.",
            )
        }
    }, [searchParams])

    return (
        <div className="mt-8 flex min-h-screen items-start justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-primary mb-8 text-center text-3xl font-semibold">
                    Log in
                </h1>

                <Formik
                    initialValues={{ email: "", password: "" }}
                    validate={values => {
                        const errors: { email?: string; password?: string } = {}
                        if (!values.email) {
                            errors.email = "Email is required"
                        } else if (
                            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                                values.email,
                            )
                        ) {
                            errors.email = "Invalid email address"
                        }
                        if (!values.password) {
                            errors.password = "Password is required"
                        }

                        // Focus first field with error
                        if (errors.email && emailRef.current) {
                            emailRef.current.focus()
                        } else if (errors.password && passwordRef.current) {
                            passwordRef.current.focus()
                        }

                        return errors
                    }}
                    validateOnChange={false}
                    validateOnBlur={false}
                    onSubmit={async (values, { setSubmitting }) => {
                        setError(null)
                        setIsLoading(true)

                        try {
                            const result = await signIn("credentials", {
                                email: values.email,
                                password: values.password,
                                redirect: false,
                            })

                            if (result?.error) {
                                setError("Invalid email or password")
                                setIsLoading(false)
                                setSubmitting(false)
                            } else if (result?.ok) {
                                // Keep loading state true during redirect
                                router.push(callbackUrl)
                                router.refresh()
                            }
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
                                    htmlFor="email"
                                    className="text-primary mb-2 block font-medium"
                                >
                                    Email
                                </label>
                                <div
                                    className="svg-outline-within relative"
                                    data-testid="login-email-field"
                                >
                                    <Field
                                        name="email"
                                        type="email"
                                        id="email"
                                        data-testid="login-email"
                                        innerRef={emailRef}
                                        className="border-primary bg-secondary text-primary placeholder:text-primary/50 w-full rounded-none border-2 px-3 py-1.5 font-medium outline-hidden"
                                        placeholder="Enter your email..."
                                        autoComplete="email"
                                    />
                                </div>
                                {props.errors.email &&
                                    props.submitCount > 0 && (
                                        <div className="text-error mt-2">
                                            {props.errors.email}
                                        </div>
                                    )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="text-primary mb-2 block font-medium"
                                >
                                    Password
                                </label>
                                <div
                                    className="svg-outline-within relative"
                                    data-testid="login-password-field"
                                >
                                    <Field
                                        name="password"
                                        type="password"
                                        id="password"
                                        data-testid="login-password"
                                        innerRef={passwordRef}
                                        className="border-primary bg-secondary text-primary placeholder:text-primary/50 w-full rounded-none border-2 px-3 py-1.5 font-medium outline-hidden"
                                        placeholder="Enter your password..."
                                        autoComplete="current-password"
                                    />
                                </div>
                                {props.errors.password &&
                                    props.submitCount > 0 && (
                                        <div className="text-error mt-2">
                                            {props.errors.password}
                                        </div>
                                    )}
                            </div>

                            <div className="flex justify-end">
                                <Link
                                    href="/auth/forgot-password"
                                    className="svg-outline text-primary relative text-sm underline hover:no-underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                data-testid="login-submit"
                                className={clsx(
                                    "svg-outline border-primary bg-primary text-secondary relative w-full cursor-pointer border-2 px-3 py-1 font-semibold",
                                    "disabled:bg-primary disabled:text-secondary disabled:cursor-not-allowed",
                                )}
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
                                    "Log in"
                                )}
                            </button>
                        </form>
                    )}
                </Formik>

                <div className="my-8 flex items-center">
                    <div className="border-primary/20 flex-1 border-t-2"></div>
                    <span className="text-primary/60 px-4 text-sm">OR</span>
                    <div className="border-primary/20 flex-1 border-t-2"></div>
                </div>

                <button
                    onClick={() => void signIn("google", { callbackUrl })}
                    disabled={isLoading}
                    className="svg-outline border-primary bg-secondary text-primary relative w-full cursor-pointer border-2 px-3 py-1 font-semibold disabled:cursor-not-allowed"
                >
                    Continue with Google
                </button>

                <p className="text-primary mt-8 text-center">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/auth/signup"
                        className="svg-outline relative font-semibold underline hover:no-underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
