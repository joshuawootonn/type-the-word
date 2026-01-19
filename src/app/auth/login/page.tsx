"use client"

import clsx from "clsx"
import { Field, Formik } from "formik"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef } from "react"

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

    return (
        <div className="mt-8 flex min-h-screen items-start justify-center">
            <div className="w-full max-w-md">
                <h1 className="mb-8 text-center text-3xl font-semibold text-primary">
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

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block font-medium text-primary"
                                >
                                    Password
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="password"
                                        type="password"
                                        id="password"
                                        innerRef={passwordRef}
                                        className="w-full rounded-none border-2 border-primary bg-secondary px-3 py-1.5 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Enter your password..."
                                        autoComplete="current-password"
                                    />
                                </div>
                                {props.errors.password &&
                                    props.submitCount > 0 && (
                                        <div className="mt-2 text-error">
                                            {props.errors.password}
                                        </div>
                                    )}
                            </div>

                            <div className="flex justify-end">
                                <Link
                                    href="/auth/forgot-password"
                                    className="svg-outline relative text-sm text-primary underline hover:no-underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={clsx(
                                    "svg-outline relative w-full cursor-pointer border-2 border-primary bg-primary px-3 py-1 font-semibold text-secondary",
                                    "disabled:cursor-not-allowed disabled:bg-primary disabled:text-secondary",
                                )}
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
                                    "Log in"
                                )}
                            </button>
                        </form>
                    )}
                </Formik>

                <div className="my-8 flex items-center">
                    <div className="flex-1 border-t-2 border-primary/20"></div>
                    <span className="px-4 text-sm text-primary/60">OR</span>
                    <div className="flex-1 border-t-2 border-primary/20"></div>
                </div>

                <button
                    onClick={() => void signIn("google", { callbackUrl })}
                    disabled={isLoading}
                    className="svg-outline relative w-full cursor-pointer border-2 border-primary bg-secondary px-3 py-1 font-semibold text-primary disabled:cursor-not-allowed"
                >
                    Continue with Google
                </button>

                <p className="mt-8 text-center text-primary">
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
