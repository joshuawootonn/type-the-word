'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { bookSchema } from '~/lib/types/book'
import bibleMetadata from '~/server/bible-metadata.json'

const books = bookSchema.options

type Course = {
    id: string
    name: string
    section?: string
}

type CoursesResponse = {
    courses?: Course[]
    needsAuth?: boolean
    error?: string
}

type AssignmentResponse = {
    success?: boolean
    needsAuth?: boolean
    error?: string
}

type Translation =
    | 'esv'
    | 'bsb'
    | 'nlt'
    | 'niv'
    | 'csb'
    | 'nkjv'
    | 'nasb'
    | 'ntv'
    | 'msg'

const translations: { value: Translation; label: string }[] = [
    { value: 'esv', label: 'ESV' },
    { value: 'bsb', label: 'BSB' },
    { value: 'niv', label: 'NIV' },
    { value: 'nlt', label: 'NLT' },
    { value: 'csb', label: 'CSB' },
    { value: 'nkjv', label: 'NKJV' },
    { value: 'nasb', label: 'NASB' },
    { value: 'ntv', label: 'NTV (Spanish)' },
    { value: 'msg', label: 'MSG' },
]

export default function ClassroomAssignPage() {
    const { data: session, status } = useSession()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(true)
    const [needsAuth, setNeedsAuth] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    // Form state
    const [selectedCourse, setSelectedCourse] = useState('')
    const [title, setTitle] = useState('')
    const [book, setBook] = useState<string>('psalm')
    const [chapter, setChapter] = useState(23)
    const [firstVerse, setFirstVerse] = useState<number | ''>('')
    const [lastVerse, setLastVerse] = useState<number | ''>('')
    const [translation, setTranslation] = useState<Translation>('esv')
    const [maxPoints, setMaxPoints] = useState(100)

    // Get chapter count for selected book
    const bookData = bibleMetadata[book as keyof typeof bibleMetadata]
    const chapterCount = bookData?.chapters?.length ?? 1
    const verseCount = bookData?.chapters?.[chapter - 1]?.length ?? 0

    // Auto-generate title when passage changes
    useEffect(() => {
        const bookLabel =
            book.charAt(0).toUpperCase() + book.slice(1).replace(/_/g, ' ')
        const verseRange = firstVerse
            ? lastVerse
                ? `:${firstVerse}-${lastVerse}`
                : `:${firstVerse}`
            : ''
        setTitle(`Type ${bookLabel} ${chapter}${verseRange}`)
    }, [book, chapter, firstVerse, lastVerse])

    // Load courses on mount
    useEffect(() => {
        if (status === 'loading') return
        if (!session?.user) {
            setIsLoadingCourses(false)
            return
        }

        fetch('/api/classroom/courses')
            .then(response => response.json() as Promise<CoursesResponse>)
            .then(data => {
                if (data.needsAuth) {
                    setNeedsAuth(true)
                } else if (data.courses) {
                    setCourses(data.courses)
                    const firstCourse = data.courses[0]
                    if (firstCourse) {
                        setSelectedCourse(firstCourse.id)
                    }
                } else if (data.error) {
                    setError(data.error)
                }
            })
            .catch(() => {
                setError('Failed to load courses')
            })
            .finally(() => {
                setIsLoadingCourses(false)
            })
    }, [session, status])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        setSuccess(false)

        fetch('/api/classroom/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId: selectedCourse,
                title,
                book,
                chapter,
                firstVerse: firstVerse || undefined,
                lastVerse: lastVerse || undefined,
                translation,
                maxPoints,
            }),
        })
            .then(response => response.json() as Promise<AssignmentResponse>)
            .then(data => {
                if (data.success) {
                    setSuccess(true)
                    // Reset form
                    setFirstVerse('')
                    setLastVerse('')
                } else if (data.needsAuth) {
                    setNeedsAuth(true)
                } else {
                    setError(data.error ?? 'Failed to create assignment')
                }
            })
            .catch(() => {
                setError('Failed to create assignment')
            })
            .finally(() => {
                setIsSubmitting(false)
            })
    }

    if (status === 'loading' || isLoadingCourses) {
        return (
            <div>
                <h1>Assign to Google Classroom</h1>
                <p>Loading...</p>
            </div>
        )
    }

    if (!session?.user) {
        return (
            <div>
                <h1>Assign to Google Classroom</h1>
                <p>
                    Please{' '}
                    <Link href="/auth/login?callbackUrl=/classroom/assign">
                        sign in
                    </Link>{' '}
                    to assign passages to your students.
                </p>
            </div>
        )
    }

    if (needsAuth) {
        return (
            <div>
                <h1>Assign to Google Classroom</h1>
                <p>You need to connect your Google Classroom account first.</p>
                <Link
                    href="/classroom/connect"
                    className="svg-outline relative mt-4 inline-block border-2 border-primary px-4 py-2 font-medium text-primary no-underline"
                >
                    Connect Google Classroom
                </Link>
            </div>
        )
    }

    if (courses.length === 0) {
        return (
            <div>
                <h1>Assign to Google Classroom</h1>
                <p>
                    No courses found. Make sure you are a teacher in at least
                    one active Google Classroom course.
                </p>
                <Link
                    href="/classroom/connect"
                    className="mt-4 inline-block text-primary"
                >
                    ← Back to Classroom settings
                </Link>
            </div>
        )
    }

    return (
        <div>
            <h1>Assign to Google Classroom</h1>

            {success && (
                <div className="mb-4 rounded border-2 border-green-500 bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                    Assignment created successfully! Students will see it in
                    Google Classroom.
                </div>
            )}

            {error && (
                <div className="mb-4 rounded border-2 border-red-500 bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Course Selection */}
                <div>
                    <label
                        htmlFor="course"
                        className="mb-2 block font-medium text-primary"
                    >
                        Select Course
                    </label>
                    <select
                        id="course"
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full max-w-md rounded border-2 border-primary bg-transparent px-3 py-2 text-primary"
                        required
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                                {course.section ? ` - ${course.section}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Passage Selection */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label
                            htmlFor="book"
                            className="mb-2 block font-medium text-primary"
                        >
                            Book
                        </label>
                        <select
                            id="book"
                            value={book}
                            onChange={e => {
                                setBook(e.target.value)
                                setChapter(1)
                                setFirstVerse('')
                                setLastVerse('')
                            }}
                            className="w-full rounded border-2 border-primary bg-transparent px-3 py-2 text-primary"
                        >
                            {books.map(b => (
                                <option key={b} value={b}>
                                    {b.charAt(0).toUpperCase() +
                                        b.slice(1).replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="chapter"
                            className="mb-2 block font-medium text-primary"
                        >
                            Chapter
                        </label>
                        <select
                            id="chapter"
                            value={chapter}
                            onChange={e => {
                                setChapter(parseInt(e.target.value))
                                setFirstVerse('')
                                setLastVerse('')
                            }}
                            className="w-full rounded border-2 border-primary bg-transparent px-3 py-2 text-primary"
                        >
                            {Array.from({ length: chapterCount }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="translation"
                            className="mb-2 block font-medium text-primary"
                        >
                            Translation
                        </label>
                        <select
                            id="translation"
                            value={translation}
                            onChange={e =>
                                setTranslation(e.target.value as Translation)
                            }
                            className="w-full rounded border-2 border-primary bg-transparent px-3 py-2 text-primary"
                        >
                            {translations.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Verse Range (optional) */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="firstVerse"
                            className="mb-2 block font-medium text-primary"
                        >
                            First Verse{' '}
                            <span className="text-sm font-normal text-gray-500">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="number"
                            id="firstVerse"
                            value={firstVerse}
                            onChange={e =>
                                setFirstVerse(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : '',
                                )
                            }
                            min={1}
                            max={verseCount}
                            placeholder={`1-${verseCount}`}
                            className="w-full rounded border-2 border-primary bg-transparent px-3 py-2 text-primary placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lastVerse"
                            className="mb-2 block font-medium text-primary"
                        >
                            Last Verse{' '}
                            <span className="text-sm font-normal text-gray-500">
                                (optional)
                            </span>
                        </label>
                        <input
                            type="number"
                            id="lastVerse"
                            value={lastVerse}
                            onChange={e =>
                                setLastVerse(
                                    e.target.value
                                        ? parseInt(e.target.value)
                                        : '',
                                )
                            }
                            min={firstVerse || 1}
                            max={verseCount}
                            placeholder={`${firstVerse || 1}-${verseCount}`}
                            disabled={!firstVerse}
                            className="w-full rounded border-2 border-primary bg-transparent px-3 py-2 text-primary placeholder:text-gray-400 disabled:opacity-50"
                        />
                    </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Leave verse fields empty to assign the entire chapter (
                    {verseCount} verses).
                </p>

                {/* Assignment Title */}
                <div>
                    <label
                        htmlFor="title"
                        className="mb-2 block font-medium text-primary"
                    >
                        Assignment Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full max-w-md rounded border-2 border-primary bg-transparent px-3 py-2 text-primary"
                        required
                    />
                </div>

                {/* Max Points */}
                <div>
                    <label
                        htmlFor="maxPoints"
                        className="mb-2 block font-medium text-primary"
                    >
                        Maximum Points
                    </label>
                    <input
                        type="number"
                        id="maxPoints"
                        value={maxPoints}
                        onChange={e => setMaxPoints(parseInt(e.target.value))}
                        min={0}
                        max={1000}
                        className="w-32 rounded border-2 border-primary bg-transparent px-3 py-2 text-primary"
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="svg-outline relative border-2 border-primary px-6 py-2 font-medium text-primary disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Assignment'}
                    </button>

                    <Link
                        href="/classroom/connect"
                        className="border-2 border-gray-300 px-4 py-2 text-gray-600 no-underline hover:border-gray-400 dark:border-gray-600 dark:text-gray-400"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
