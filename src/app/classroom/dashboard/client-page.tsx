"use client"

import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { Loading } from "~/components/loading"
import { Link } from "~/components/ui/link"

import { type Course } from "../../api/classroom/schemas"
import { fetchCourses } from "./actions"

export function ClientPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadCourses = useCallback(async () => {
        try {
            const result = await fetchCourses()
            setCourses(result.courses)

            // Auto-redirect if only one course
            if (result.courses.length === 1 && result.courses[0]) {
                router.push(`/classroom/${result.courses[0].id}`)
                return
            }
        } catch (_err) {
            setError("Failed to load courses")
        } finally {
            setIsLoading(false)
        }
    }, [router])

    useEffect(() => {
        void loadCourses()
    }, [loadCourses])

    return (
        <div>
            <h1>Dashboard</h1>

            {isLoading ? (
                <Loading />
            ) : error ? (
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">{error}</p>
                    <Link href="/classroom" className="mt-4">
                        Back to Classroom
                    </Link>
                </div>
            ) : courses.length === 0 ? (
                <div className="not-prose border-2 border-primary bg-secondary p-6">
                    <p>No courses found.</p>
                    <Link href="/classroom" className="mt-4">
                        Back to Classroom
                    </Link>
                </div>
            ) : (
                <div className="not-prose space-y-4">
                    <p>Select a course to view assignments:</p>
                    <div className="grid gap-3">
                        {courses.map(course => (
                            <NextLink
                                key={course.id}
                                href={`/classroom/${course.id}`}
                                className="svg-outline relative block border-2 border-primary bg-secondary p-4 no-underline"
                            >
                                <div className="font-semibold">
                                    {course.name}
                                </div>
                                {course.section && (
                                    <div className="text-sm opacity-75">
                                        {course.section}
                                    </div>
                                )}
                            </NextLink>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
