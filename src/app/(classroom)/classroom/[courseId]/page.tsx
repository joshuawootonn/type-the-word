import { getServerSession } from "next-auth"

import { StudentClientPage } from "~/app/(classroom)/classroom/[courseId]/student-client-page"
import { TeacherClientPage } from "~/app/(classroom)/classroom/[courseId]/teacher-client-page"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Link } from "~/components/ui/link"
import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    listCourses,
    listStudentCourses,
} from "~/server/clients/classroom.client"
import {
    getTeacherToken,
    getStudentToken,
} from "~/server/repositories/classroom.repository"

interface PageProps {
    params: Promise<{ courseId: string }>
}

export default async function CoursePage({ params }: PageProps) {
    const session = await getServerSession(authOptions)
    const { courseId } = await params

    if (!session?.user) {
        return (
            <div>
                <h1>Course</h1>
                <p>Please sign in to view this course.</p>
                <Link
                    href={`/auth/login?callbackUrl=%2Fclassroom%2F${encodeURIComponent(courseId)}`}
                >
                    Log in
                </Link>
            </div>
        )
    }

    const teacherToken = await getTeacherToken(session.user.id).catch(
        () => null,
    )
    const studentToken = await getStudentToken(session.user.id).catch(
        () => null,
    )

    if (!teacherToken && !studentToken) {
        return (
            <div>
                <h1>Course</h1>
                <ClassroomNotice
                    variant="error"
                    message="Please connect your Google Classroom account first."
                    linkHref="/classroom"
                    linkLabel="Connect Google Classroom"
                />
            </div>
        )
    }

    let courses
    if (teacherToken) {
        const validToken = await getValidTeacherToken(session.user.id)
        courses = await listCourses(validToken.accessToken)
    } else if (studentToken) {
        const validToken = await getValidStudentToken(session.user.id)
        courses = await listStudentCourses(validToken.accessToken)
    } else {
        throw new Error("No valid token found")
    }

    const course = courses.find(c => c.id === courseId)

    if (!course) {
        return (
            <div>
                <h1>Course Not Found</h1>
                <p>
                    This course could not be found or you don&apos;t have access
                    to it.
                </p>
                <Link
                    href="/classroom/dashboard"
                    className="svg-outline border-primary relative border-2 px-3 py-1 font-semibold no-underline"
                >
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    if (teacherToken) {
        return (
            <TeacherClientPage courseId={courseId} courseName={course.name} />
        )
    }

    return <StudentClientPage courseId={courseId} courseName={course.name} />
}
