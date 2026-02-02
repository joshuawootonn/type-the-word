"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Input, Textarea } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import toProperCase from "~/lib/toProperCase"
import { bookSchema } from "~/lib/types/book"
import { Translation, translationsSchema } from "~/server/db/schema"

import { type Course } from "../../api/classroom/schemas"
import { createAssignment, fetchCourses } from "./actions"

interface ClientPageProps {
    initialCourseId?: string
}

export function ClientPage({ initialCourseId }: ClientPageProps = {}) {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Form state
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId || "")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [translation, setTranslation] = useState<Translation>("esv")
    const [book, setBook] = useState("genesis")
    const [startChapter, setStartChapter] = useState(1)
    const [startVerse, setStartVerse] = useState(1)
    const [endChapter, setEndChapter] = useState(1)
    const [endVerse, setEndVerse] = useState(1)
    const [maxPoints, setMaxPoints] = useState(100)
    const [dueDate, setDueDate] = useState("")

    // Load courses on mount
    useEffect(() => {
        async function loadCourses() {
            try {
                const result = await fetchCourses()
                setCourses(result.courses)

                // If initialCourseId provided, verify it exists in the courses list
                if (initialCourseId) {
                    const courseExists = result.courses.some(
                        c => c.id === initialCourseId,
                    )
                    if (courseExists) {
                        setSelectedCourse(initialCourseId)
                    } else if (result.courses.length > 0 && result.courses[0]) {
                        // Fall back to first course if initialCourseId invalid
                        setSelectedCourse(result.courses[0].id)
                    }
                } else if (result.courses.length > 0 && result.courses[0]) {
                    // No initialCourseId - use first course
                    setSelectedCourse(result.courses[0].id)
                }
            } catch (_err) {
                setError(
                    "Failed to load courses. Please connect Google Classroom first.",
                )
            } finally {
                setIsLoadingCourses(false)
            }
        }
        loadCourses()
    }, [initialCourseId])

    // Update title when passage changes
    useEffect(() => {
        // Format book name with proper casing
        const bookName = toProperCase(book.split("_").join(" "))

        // Shorten reference if same chapter (e.g., "51:1-10" instead of "51:1-51:10")
        const reference =
            startChapter === endChapter
                ? `${startChapter}:${startVerse}-${endVerse}`
                : `${startChapter}:${startVerse}-${endChapter}:${endVerse}`

        setTitle(`${bookName} ${reference}`)
    }, [book, startChapter, startVerse, endChapter, endVerse])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsCreating(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await createAssignment({
                courseId: selectedCourse,
                title,
                description: description || undefined,
                translation,
                book,
                startChapter,
                startVerse,
                endChapter,
                endVerse,
                maxPoints,
                dueDate: dueDate || undefined,
            })

            setSuccess(true)

            // Redirect to the created assignment after a moment
            setTimeout(() => {
                router.push(
                    `/classroom/${selectedCourse}/assignment/${result.assignmentId}`,
                )
            }, 5000)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create assignment",
            )
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div>
            <h1>Create Assignment</h1>

            {isLoadingCourses ? (
                <Loading />
            ) : courses.length === 0 ? (
                <ClassroomNotice
                    variant="error"
                    message="No courses found. Please make sure you have active courses in Google Classroom and try reconnecting your account."
                    linkHref="/classroom"
                    linkLabel="Back to Classroom"
                />
            ) : (
                <>
                    {error && (
                        <div className="not-prose mb-8 flex items-start gap-3 border-2 border-error bg-secondary p-4">
                            <svg
                                className="h-5 w-5 flex-shrink-0 text-error"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="translate-y-[1px] text-sm text-error">
                                {error}
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="not-prose mb-8 flex items-start gap-3 border-2 border-success bg-secondary p-4">
                            <svg
                                className="h-5 w-5 flex-shrink-0 text-success"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-success">
                                Assignment created in draft mode. Publish it to
                                make it visible to students.
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="not-prose space-y-6"
                    >
                        {/* Course Selection */}
                        <div>
                            <label
                                htmlFor="course"
                                className="mb-2 block font-medium"
                            >
                                Course
                            </label>
                            <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map(course => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id}
                                        >
                                            {course.name}
                                            {course.section
                                                ? ` - ${course.section}`
                                                : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Passage Selection */}
                        <div>
                            <h2 className="mb-4">Passage</h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="translation"
                                        className="mb-2 block"
                                    >
                                        Translation
                                    </label>
                                    <Select
                                        value={translation}
                                        onValueChange={val =>
                                            setTranslation(val as Translation)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {translationsSchema.options.map(
                                                t => (
                                                    <SelectItem
                                                        key={t}
                                                        value={t}
                                                    >
                                                        {t.toUpperCase()}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="book"
                                        className="mb-2 block"
                                    >
                                        Book
                                    </label>
                                    <Select
                                        value={book}
                                        onValueChange={setBook}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bookSchema.options.map(b => (
                                                <SelectItem key={b} value={b}>
                                                    {toProperCase(
                                                        b.split("_").join(" "),
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="startChapter"
                                        className="mb-2 block"
                                    >
                                        Start Chapter
                                    </label>
                                    <Input
                                        type="number"
                                        id="startChapter"
                                        min="1"
                                        value={startChapter}
                                        onChange={e =>
                                            setStartChapter(
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="startVerse"
                                        className="mb-2 block"
                                    >
                                        Start Verse
                                    </label>
                                    <Input
                                        type="number"
                                        id="startVerse"
                                        min="1"
                                        value={startVerse}
                                        onChange={e =>
                                            setStartVerse(
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="endChapter"
                                        className="mb-2 block"
                                    >
                                        End Chapter
                                    </label>
                                    <Input
                                        type="number"
                                        id="endChapter"
                                        min="1"
                                        value={endChapter}
                                        onChange={e =>
                                            setEndChapter(
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="endVerse"
                                        className="mb-2 block"
                                    >
                                        End Verse
                                    </label>
                                    <Input
                                        type="number"
                                        id="endVerse"
                                        min="1"
                                        value={endVerse}
                                        onChange={e =>
                                            setEndVerse(
                                                parseInt(e.target.value) || 1,
                                            )
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="title" className="mb-2 block">
                                Assignment Title
                            </label>
                            <Input
                                type="text"
                                id="title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="mb-2 block">
                                Description (optional)
                            </label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="maxPoints"
                                    className="mb-2 block"
                                >
                                    Max Points
                                </label>
                                <Input
                                    type="number"
                                    id="maxPoints"
                                    min="1"
                                    value={maxPoints}
                                    onChange={e =>
                                        setMaxPoints(
                                            parseInt(e.target.value) || 100,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="dueDate" className="mb-2 block">
                                    Due Date (optional)
                                </label>
                                <Input
                                    type="date"
                                    id="dueDate"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 border-t-2 border-primary pt-6">
                            <Button
                                type="submit"
                                isLoading={isCreating}
                                loadingLabel="Creating"
                            >
                                Create Assignment
                            </Button>
                            <a
                                href="/classroom"
                                className="svg-outline relative border-2 border-primary bg-secondary px-3 py-1 font-semibold no-underline"
                            >
                                Cancel
                            </a>
                        </div>
                    </form>
                </>
            )}
        </div>
    )
}
