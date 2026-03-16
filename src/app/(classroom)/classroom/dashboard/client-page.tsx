"use client"

import { DotsThree } from "@phosphor-icons/react"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { type Course } from "~/app/api/classroom/schemas"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuPositioner,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { getGoogleClassroomHomeUrl } from "~/lib/googleClassroomUrl"

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
            <div className="mb-4 flex items-center gap-2">
                <h1 className="my-0">Dashboard</h1>
                <div className="not-prose">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="svg-outline relative inline-flex cursor-pointer items-center justify-center p-1 outline-hidden"
                            aria-label="Dashboard actions"
                        >
                            <DotsThree
                                aria-hidden="true"
                                weight="bold"
                                className="h-5 w-5"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuPositioner align="end">
                                <DropdownMenuContent>
                                    {isTeacher && (
                                        <>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    router.push(
                                                        "/classroom/organization",
                                                    )
                                                }}
                                            >
                                                Organization
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    router.push(
                                                        "/classroom/dashboard/settings",
                                                    )
                                                }}
                                            >
                                                Settings
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => {
                                            window.open(
                                                getGoogleClassroomHomeUrl(),
                                                "_blank",
                                                "noopener,noreferrer",
                                            )
                                        }}
                                    >
                                        Go to Google Classroom
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenuPositioner>
                        </DropdownMenuPortal>
                    </DropdownMenu>
                </div>
            </div>

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
