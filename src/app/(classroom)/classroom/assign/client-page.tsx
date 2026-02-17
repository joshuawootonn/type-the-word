"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { type Course } from "~/app/api/classroom/schemas"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Input, Textarea } from "~/components/ui/input"
import { NumberInput } from "~/components/ui/number-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { useAnalytics } from "~/lib/hooks/useAnalytics"
import toProperCase from "~/lib/toProperCase"
import { bookSchema } from "~/lib/types/book"
import { Translation, translationsSchema } from "~/server/db/schema"

import { createAssignment, fetchCourses } from "./actions"

type ChapterMetadata = {
    length: number
}

type BookMetadata = {
    chapters: ChapterMetadata[]
}

type BibleMetadata = Record<string, BookMetadata>

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

interface ClientPageProps {
    initialCourseId?: string
    initialTranslation?: Translation
}

export function ClientPage({
    initialCourseId,
    initialTranslation,
}: ClientPageProps = {}) {
    const DEFAULT_MAX_POINTS = 100
    const router = useRouter()
    const { trackAssignmentCreated } = useAnalytics()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Form state
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId || "")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [translation, setTranslation] = useState<Translation>(
        initialTranslation ?? "esv",
    )
    const [book, setBook] = useState("genesis")
    const [startChapter, setStartChapter] = useState(1)
    const [startVerse, setStartVerse] = useState(1)
    const [endChapter, setEndChapter] = useState(1)
    const [endVerse, setEndVerse] = useState(1)
    const [dueDate, setDueDate] = useState("")
    const [metadata, setMetadata] = useState<BibleMetadata | null>(null)

    useEffect(() => {
        let isMounted = true

        async function loadMetadata() {
            try {
                const metadataModule = await import(
                    "../../../../server/bible-metadata/" + translation + ".json"
                )
                if (isMounted) {
                    setMetadata(metadataModule.default)
                }
            } catch (_err) {
                if (isMounted) {
                    setMetadata(null)
                }
            }
        }

        loadMetadata()

        return () => {
            isMounted = false
        }
    }, [translation])

    const bookMetadata = metadata?.[book]
    const chapterCount = Math.max(bookMetadata?.chapters.length ?? 1, 1)
    const startChapterMax = chapterCount
    const endChapterMax = chapterCount
    const getVerseMaxForChapter = useCallback(
        (chapter: number) =>
            Math.max(bookMetadata?.chapters[chapter - 1]?.length ?? 1, 1),
        [bookMetadata],
    )
    const startChapterVerseMax = getVerseMaxForChapter(startChapter)
    const endChapterVerseMax = getVerseMaxForChapter(endChapter)

    // Keep passage range valid when metadata/book/translation changes.
    useEffect(() => {
        const normalizedStartChapter = clamp(startChapter, 1, startChapterMax)
        const normalizedStartVerse = clamp(
            startVerse,
            1,
            getVerseMaxForChapter(normalizedStartChapter),
        )
        const normalizedEndChapter = clamp(
            endChapter,
            normalizedStartChapter,
            endChapterMax,
        )
        const endVerseMin =
            normalizedEndChapter === normalizedStartChapter
                ? normalizedStartVerse
                : 1
        const normalizedEndVerse = clamp(
            endVerse,
            endVerseMin,
            getVerseMaxForChapter(normalizedEndChapter),
        )

        if (normalizedStartChapter !== startChapter) {
            setStartChapter(normalizedStartChapter)
        }
        if (normalizedStartVerse !== startVerse) {
            setStartVerse(normalizedStartVerse)
        }
        if (normalizedEndChapter !== endChapter) {
            setEndChapter(normalizedEndChapter)
        }
        if (normalizedEndVerse !== endVerse) {
            setEndVerse(normalizedEndVerse)
        }
    }, [
        startChapter,
        startVerse,
        endChapter,
        endVerse,
        startChapterMax,
        endChapterMax,
        getVerseMaxForChapter,
    ])

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

    async function updateTranslationCookie(nextTranslation: Translation) {
        await fetch("/api/set-translation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ translation: nextTranslation }),
        })
    }

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
                maxPoints: DEFAULT_MAX_POINTS,
                dueDate: dueDate || undefined,
            })

            trackAssignmentCreated({
                assignmentId: result.assignmentId,
                courseId: selectedCourse,
                courseWorkId: result.courseWorkId,
                translation,
                book,
                startChapter,
                startVerse,
                endChapter,
                endVerse,
                maxPoints: DEFAULT_MAX_POINTS,
                hasDescription: description.trim().length > 0,
                hasDueDate: Boolean(dueDate),
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
                        <div className="not-prose border-error bg-secondary mb-8 flex items-start gap-3 border-2 p-4">
                            <svg
                                className="text-error h-5 w-5 shrink-0"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-error translate-y-px text-sm">
                                {error}
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="not-prose border-success bg-secondary mb-8 flex items-start gap-3 border-2 p-4">
                            <svg
                                className="text-success h-5 w-5 shrink-0"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-success text-sm">
                                Assignment created in draft mode. Publish it to
                                make it visible to students.
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="not-prose space-y-8 text-sm"
                    >
                        {/* Course Selection */}
                        <div className="space-y-2">
                            <label
                                htmlFor="course"
                                className="mb-2 block text-lg"
                            >
                                Course
                            </label>
                            <Select
                                value={selectedCourse}
                                onValueChange={setSelectedCourse}
                            >
                                <SelectTrigger className="w-full sm:w-1/2">
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
                        <div className="space-y-4">
                            <h2 className="mb-4 text-lg">Passage</h2>

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
                                        onValueChange={val => {
                                            const nextTranslation =
                                                val as Translation
                                            setTranslation(nextTranslation)
                                            void updateTranslationCookie(
                                                nextTranslation,
                                            )
                                        }}
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
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <NumberInput
                                        id="startChapter"
                                        label="Start Chapter"
                                        min={1}
                                        max={startChapterMax}
                                        value={startChapter}
                                        onValueChange={nextStartChapter => {
                                            const normalizedStartChapter =
                                                clamp(
                                                    nextStartChapter,
                                                    1,
                                                    startChapterMax,
                                                )
                                            const normalizedStartVerse = clamp(
                                                startVerse,
                                                1,
                                                getVerseMaxForChapter(
                                                    normalizedStartChapter,
                                                ),
                                            )
                                            const normalizedEndChapter = clamp(
                                                endChapter,
                                                normalizedStartChapter,
                                                endChapterMax,
                                            )
                                            const endVerseMin =
                                                normalizedEndChapter ===
                                                normalizedStartChapter
                                                    ? normalizedStartVerse
                                                    : 1
                                            const normalizedEndVerse = clamp(
                                                endVerse,
                                                endVerseMin,
                                                getVerseMaxForChapter(
                                                    normalizedEndChapter,
                                                ),
                                            )

                                            setStartChapter(
                                                normalizedStartChapter,
                                            )
                                            setStartVerse(normalizedStartVerse)
                                            setEndChapter(normalizedEndChapter)
                                            setEndVerse(normalizedEndVerse)
                                        }}
                                        inputSize="compact"
                                        preventEnterSubmit
                                        required
                                    />
                                </div>

                                <div>
                                    <NumberInput
                                        id="startVerse"
                                        label="Start Verse"
                                        min={1}
                                        max={startChapterVerseMax}
                                        value={startVerse}
                                        onValueChange={nextStartVerse => {
                                            const normalizedStartVerse = clamp(
                                                nextStartVerse,
                                                1,
                                                startChapterVerseMax,
                                            )
                                            const endVerseMin =
                                                endChapter === startChapter
                                                    ? normalizedStartVerse
                                                    : 1
                                            const normalizedEndVerse = clamp(
                                                endVerse,
                                                endVerseMin,
                                                getVerseMaxForChapter(
                                                    endChapter,
                                                ),
                                            )

                                            setStartVerse(normalizedStartVerse)
                                            setEndVerse(normalizedEndVerse)
                                        }}
                                        inputSize="compact"
                                        preventEnterSubmit
                                        required
                                    />
                                </div>

                                <div>
                                    <NumberInput
                                        id="endChapter"
                                        label="End Chapter"
                                        min={startChapter}
                                        max={endChapterMax}
                                        value={endChapter}
                                        onValueChange={nextEndChapter => {
                                            const normalizedEndChapter = clamp(
                                                nextEndChapter,
                                                startChapter,
                                                endChapterMax,
                                            )
                                            const endVerseMin =
                                                normalizedEndChapter ===
                                                startChapter
                                                    ? startVerse
                                                    : 1
                                            const normalizedEndVerse = clamp(
                                                endVerse,
                                                endVerseMin,
                                                getVerseMaxForChapter(
                                                    normalizedEndChapter,
                                                ),
                                            )

                                            setEndChapter(normalizedEndChapter)
                                            setEndVerse(normalizedEndVerse)
                                        }}
                                        inputSize="compact"
                                        preventEnterSubmit
                                        required
                                    />
                                </div>

                                <div>
                                    <NumberInput
                                        id="endVerse"
                                        label="End Verse"
                                        min={
                                            endChapter === startChapter
                                                ? startVerse
                                                : 1
                                        }
                                        max={endChapterVerseMax}
                                        value={endVerse}
                                        onValueChange={nextEndVerse => {
                                            const endVerseMin =
                                                endChapter === startChapter
                                                    ? startVerse
                                                    : 1
                                            setEndVerse(
                                                clamp(
                                                    nextEndVerse,
                                                    endVerseMin,
                                                    endChapterVerseMax,
                                                ),
                                            )
                                        }}
                                        inputSize="compact"
                                        preventEnterSubmit
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label
                                htmlFor="course"
                                className="mb-2 block text-lg"
                            >
                                Assignment
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="title"
                                        className="mb-2 block"
                                    >
                                        Title
                                    </label>
                                    <Input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        inputSize="compact"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="dueDate"
                                        className="mb-2 block"
                                    >
                                        Due Date
                                    </label>
                                    <Input
                                        type="date"
                                        id="dueDate"
                                        value={dueDate}
                                        onChange={e =>
                                            setDueDate(e.target.value)
                                        }
                                        inputSize="compact"
                                    />
                                </div>
                            </div>
                            <label htmlFor="description" className="mb-2 block">
                                Description
                            </label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                textareaSize="compact"
                                rows={3}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                isLoading={isCreating}
                                loadingLabel="Creating"
                            >
                                Create Assignment
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </div>
    )
}
