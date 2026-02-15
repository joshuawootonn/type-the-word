"use client"

import { ArrowLineDown, CaretDoubleDown } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { type Course } from "~/app/api/classroom/schemas"
import { ClassroomNotice } from "~/components/classroom-notice"
import { Loading } from "~/components/loading"
import { Button } from "~/components/ui/button"
import { Input, Textarea } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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

interface ClientPageProps {
    initialCourseId?: string
    initialTranslation?: Translation
}

export function ClientPage({
    initialCourseId,
    initialTranslation,
}: ClientPageProps = {}) {
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
    const [maxPoints, setMaxPoints] = useState(100)
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
    const getVerseMaxForChapter = (chapter: number) =>
        Math.max(bookMetadata?.chapters[chapter - 1]?.length ?? 1, 1)
    const startChapterVerseMax = getVerseMaxForChapter(startChapter)
    const endChapterVerseMax = getVerseMaxForChapter(endChapter)

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
                maxPoints,
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
                maxPoints,
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
                        className="not-prose space-y-6"
                    >
                        {/* Course Selection */}
                        <div>
                            <Label htmlFor="course">Course</Label>
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
                                    <Label htmlFor="translation">
                                        Translation
                                    </Label>
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
                                    <Label htmlFor="book">Book</Label>
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
                                    <Label htmlFor="startChapter">
                                        Start Chapter
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <div className="grow">
                                            <Input
                                                type="number"
                                                id="startChapter"
                                                min="1"
                                                max={startChapterMax}
                                                value={startChapter}
                                                onChange={e => {
                                                    const nextStartChapter =
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1
                                                    setStartChapter(
                                                        nextStartChapter,
                                                    )
                                                    setStartVerse(
                                                        currentVerse =>
                                                            Math.min(
                                                                currentVerse,
                                                                getVerseMaxForChapter(
                                                                    nextStartChapter,
                                                                ),
                                                            ),
                                                    )
                                                }}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const lastChapter =
                                                    startChapterMax
                                                setStartChapter(lastChapter)
                                                setStartVerse(currentVerse =>
                                                    Math.min(
                                                        currentVerse,
                                                        getVerseMaxForChapter(
                                                            lastChapter,
                                                        ),
                                                    ),
                                                )
                                            }}
                                            className="svg-outline border-primary bg-secondary relative shrink-0 border-2 p-2"
                                            aria-label="Set start chapter to the last chapter in this book"
                                            title="Use last chapter"
                                        >
                                            <CaretDoubleDown
                                                aria-hidden
                                                size={16}
                                                weight="bold"
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="startVerse">
                                        Start Verse
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <div className="grow">
                                            <Input
                                                type="number"
                                                id="startVerse"
                                                min="1"
                                                max={startChapterVerseMax}
                                                value={startVerse}
                                                onChange={e =>
                                                    setStartVerse(
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setStartVerse(
                                                    startChapterVerseMax,
                                                )
                                            }
                                            className="svg-outline border-primary bg-secondary relative shrink-0 border-2 p-2"
                                            aria-label="Set start verse to the last verse in this chapter"
                                            title="Use last verse"
                                        >
                                            <ArrowLineDown
                                                aria-hidden
                                                size={16}
                                                weight="bold"
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="endChapter">
                                        End Chapter
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <div className="grow">
                                            <Input
                                                type="number"
                                                id="endChapter"
                                                min="1"
                                                max={endChapterMax}
                                                value={endChapter}
                                                onChange={e => {
                                                    const nextEndChapter =
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1
                                                    setEndChapter(
                                                        nextEndChapter,
                                                    )
                                                    setEndVerse(currentVerse =>
                                                        Math.min(
                                                            currentVerse,
                                                            getVerseMaxForChapter(
                                                                nextEndChapter,
                                                            ),
                                                        ),
                                                    )
                                                }}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const lastChapter =
                                                    endChapterMax
                                                setEndChapter(lastChapter)
                                                setEndVerse(currentVerse =>
                                                    Math.min(
                                                        currentVerse,
                                                        getVerseMaxForChapter(
                                                            lastChapter,
                                                        ),
                                                    ),
                                                )
                                            }}
                                            className="svg-outline border-primary bg-secondary relative shrink-0 border-2 p-2"
                                            aria-label="Set end chapter to the last chapter in this book"
                                            title="Use last chapter"
                                        >
                                            <CaretDoubleDown
                                                aria-hidden
                                                size={16}
                                                weight="bold"
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="endVerse">End Verse</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="grow">
                                            <Input
                                                type="number"
                                                id="endVerse"
                                                min="1"
                                                max={endChapterVerseMax}
                                                value={endVerse}
                                                onChange={e =>
                                                    setEndVerse(
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 1,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEndVerse(endChapterVerseMax)
                                            }
                                            className="svg-outline border-primary bg-secondary relative shrink-0 border-2 p-2"
                                            aria-label="Set end verse to the last verse in this chapter"
                                            title="Use last verse"
                                        >
                                            <ArrowLineDown
                                                aria-hidden
                                                size={16}
                                                weight="bold"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="title">Assignment Title</Label>
                            <Input
                                type="text"
                                id="title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="maxPoints">Max Points</Label>
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
                                <Label htmlFor="dueDate">
                                    Due Date (optional)
                                </Label>
                                <Input
                                    type="date"
                                    id="dueDate"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="border-primary flex justify-end gap-3 border-t-2 pt-6">
                            <Button
                                type="submit"
                                isLoading={isCreating}
                                loadingLabel="Creating"
                            >
                                Create Assignment
                            </Button>
                            <a
                                href="/classroom"
                                className="svg-outline border-primary bg-secondary relative border-2 px-3 py-1 font-semibold no-underline"
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
