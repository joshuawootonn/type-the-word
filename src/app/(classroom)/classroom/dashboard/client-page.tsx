"use client"

import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { type Course } from "~/app/api/classroom/schemas"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Link } from "~/components/ui/link"

import { fetchCourses } from "./actions"

type ClientPageProps = {
    isTeacher: boolean
}

export function ClientPage({ isTeacher }: ClientPageProps) {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadCourses = useCallback(async () => {
        try {
            const result = await fetchCourses()
            setCourses(result.courses)

            // Auto-redirect only for students with one course.
            if (
                !isTeacher &&
                result.courses.length === 1 &&
                result.courses[0]
            ) {
                router.push(`/classroom/${result.courses[0].id}`)
                return
            }
        } catch (_err) {
            setError("Failed to load courses")
        } finally {
            setIsLoading(false)
        }
    }, [isTeacher, router])

    useEffect(() => {
        void loadCourses()
    }, [loadCourses])

    return (
        <div>
            <h1>Dashboard</h1>
            {isTeacher && (
                <div className="not-prose mb-4 flex gap-3">
                    <Link href="/classroom/organization">Organization</Link>
                    <Link href="/classroom/dashboard/settings">Settings</Link>
                </div>
            )}

            {isLoading ? (
                <Loading />
            ) : error ? (
                <ClassroomNotice
                    variant="error"
                    message={error}
                    linkHref="/classroom"
                    linkLabel="Back to Classroom"
                />
            ) : courses.length === 0 ? (
                <ClassroomNotice
                    variant="notice"
                    message="No courses found."
                    linkHref="/classroom"
                    linkLabel="Back to Classroom"
                />
            ) : (
                <div className="not-prose space-y-4">
                    <p>Select a course to view assignments:</p>
                    <div className="grid gap-3">
                        {courses.map(course => (
                            <NextLink
                                key={course.id}
                                href={`/classroom/${course.id}`}
                                className="svg-outline border-primary bg-secondary relative block border-2 p-4 no-underline"
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
