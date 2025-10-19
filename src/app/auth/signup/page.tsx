'use client'

import { signIn } from 'next-auth/react'
import { Field, Formik } from 'formik'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loading } from '~/components/loading'
import { cn } from '~/lib/cn'

export default function SignUpPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const firstNameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)

    return (
        <div className="mt-8 flex min-h-screen items-start justify-center">
            <div className="w-full max-w-md">
                <h1 className="mb-8 text-center text-3xl font-semibold text-primary">
                    Sign up
                </h1>

                <Formik
                    initialValues={{
                        firstName: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                    }}
                    validate={values => {
                        const errors: {
                            firstName?: string
                            email?: string
                            password?: string
                            confirmPassword?: string
                        } = {}

                        if (!values.firstName) {
                            errors.firstName = 'First name is required'
                        } else if (values.firstName.length > 50) {
                            errors.firstName =
                                'First name must be less than 50 characters'
                        }

                        if (!values.email) {
                            errors.email = 'Email is required'
                        } else if (
                            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                                values.email,
                            )
                        ) {
                            errors.email = 'Invalid email address'
                        }

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

                        // Focus first field with error
                        if (errors.firstName && firstNameRef.current) {
                            firstNameRef.current.focus()
                        } else if (errors.email && emailRef.current) {
                            emailRef.current.focus()
                        } else if (errors.password && passwordRef.current) {
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
                            const response = await fetch('/api/auth/signup', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    firstName: values.firstName,
                                    email: values.email,
                                    password: values.password,
                                }),
                            })

                            const data: {
                                error?: string
                                success?: boolean
                            } = await response.json()

                            if (!response.ok) {
                                setError(
                                    data.error ??
                                        'An error occurred during signup',
                                )
                                setIsLoading(false)
                                setSubmitting(false)
                                return
                            }

                            // Auto log in after successful signup
                            const result = await signIn('credentials', {
                                email: values.email,
                                password: values.password,
                                redirect: false,
                            })

                            if (result?.ok) {
                                // Keep loading state true during redirect
                                router.push('/')
                                router.refresh()
                            } else {
                                // Signup succeeded but login failed, redirect to login page
                                router.push('/auth/login')
                            }
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
                                    htmlFor="firstName"
                                    className="mb-2 block font-medium text-primary"
                                >
                                    First Name
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="firstName"
                                        type="text"
                                        id="firstName"
                                        innerRef={firstNameRef}
                                        className="w-full rounded-none border-2 border-primary bg-secondary py-1.5 px-3 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Enter your first name..."
                                        autoComplete="given-name"
                                    />
                                </div>
                                {props.errors.firstName &&
                                    props.submitCount > 0 && (
                                        <div className="mt-2 text-error">
                                            {props.errors.firstName}
                                        </div>
                                    )}
                            </div>

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
                                        className="w-full rounded-none border-2 border-primary bg-secondary py-1.5 px-3 font-medium text-primary outline-none placeholder:text-primary/50"
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
                                        className="w-full rounded-none border-2 border-primary bg-secondary py-1.5 px-3 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Create a password..."
                                        autoComplete="new-password"
                                    />
                                </div>
                                {props.errors.password &&
                                    props.submitCount > 0 && (
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
                                    Confirm Password
                                </label>
                                <div className="svg-outline-within relative">
                                    <Field
                                        name="confirmPassword"
                                        type="password"
                                        id="confirmPassword"
                                        innerRef={confirmPasswordRef}
                                        className="w-full rounded-none border-2 border-primary bg-secondary py-1.5 px-3 font-medium text-primary outline-none placeholder:text-primary/50"
                                        placeholder="Confirm your password..."
                                        autoComplete="new-password"
                                    />
                                </div>
                                {props.errors.confirmPassword &&
                                    props.submitCount > 0 && (
                                        <div className="mt-2 text-error">
                                            {props.errors.confirmPassword}
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
                                                'text-md absolute left-1/2 top-1/2 -translate-x-8 -translate-y-1/2 font-semibold',
                                                isLoading
                                                    ? 'text-secondary'
                                                    : 'text-primary',
                                            )}
                                        />

                                        <div className="h-6" />
                                    </>
                                ) : (
                                    'Sign up'
                                )}
                            </button>
                        </form>
                    )}
                </Formik>

                <p className="mt-8 text-center text-primary">
                    Already have an account?{' '}
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
