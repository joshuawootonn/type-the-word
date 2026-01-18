'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { bookSchema } from '~/lib/types/book'

const books = bookSchema.options

type AttachmentResponse = {
    success?: boolean
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

/**
 * Attachment Setup View (iframe)
 * This page is shown to teachers when they add a Type the Word assignment
 * in Google Classroom's add-on panel.
 *
 * Query parameters from Classroom:
 * - courseId: The course ID
 * - itemId: The coursework item ID
 * - addOnToken: Token for Classroom API calls
 * - login_hint: Teacher's email (for SSO)
 */
export default function AttachmentSetupPage() {
    const searchParams = useSearchParams()

    // Classroom context from query params
    const courseId = searchParams?.get('courseId')
    const itemId = searchParams?.get('itemId')
    const loginHint = searchParams?.get('login_hint')

    // Form state
    const [book, setBook] = useState<string>('psalm')
    const [chapter, setChapter] = useState(23)
    const [firstVerse, setFirstVerse] = useState<number | ''>('')
    const [lastVerse, setLastVerse] = useState<number | ''>('')
    const [translation, setTranslation] = useState<Translation>('esv')
    const [title, setTitle] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        fetch('/api/classroom/addon/attachment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId,
                itemId,
                loginHint,
                book,
                chapter,
                firstVerse: firstVerse || undefined,
                lastVerse: lastVerse || undefined,
                translation,
                title,
            }),
        })
            .then(response => response.json() as Promise<AttachmentResponse>)
            .then(data => {
                if (data.success) {
                    // Close the iframe by posting a message to the parent
                    window.parent.postMessage(
                        { type: 'classroom-addon-attachment-created' },
                        '*',
                    )
                } else {
                    setError(data.error ?? 'Failed to create attachment')
                }
            })
            .catch(() => {
                setError('Failed to create attachment')
            })
            .finally(() => {
                setIsSubmitting(false)
            })
    }

    if (!courseId) {
        return (
            <div className="p-4">
                <p className="text-red-600">
                    This page should be accessed from Google Classroom.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-lg p-4">
            <h1 className="mb-4 text-xl font-bold text-primary">
                Add Type the Word Assignment
            </h1>

            {error && (
                <div className="mb-4 rounded border border-red-500 bg-red-50 p-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Book Selection */}
                <div>
                    <label
                        htmlFor="book"
                        className="mb-1 block text-sm font-medium text-primary"
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
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                        {books.map(b => (
                            <option key={b} value={b}>
                                {b.charAt(0).toUpperCase() +
                                    b.slice(1).replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Chapter and Translation */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            htmlFor="chapter"
                            className="mb-1 block text-sm font-medium text-primary"
                        >
                            Chapter
                        </label>
                        <input
                            type="number"
                            id="chapter"
                            value={chapter}
                            onChange={e => {
                                setChapter(parseInt(e.target.value) || 1)
                                setFirstVerse('')
                                setLastVerse('')
                            }}
                            min={1}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="translation"
                            className="mb-1 block text-sm font-medium text-primary"
                        >
                            Translation
                        </label>
                        <select
                            id="translation"
                            value={translation}
                            onChange={e =>
                                setTranslation(e.target.value as Translation)
                            }
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
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
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            htmlFor="firstVerse"
                            className="mb-1 block text-sm font-medium text-primary"
                        >
                            First Verse{' '}
                            <span className="font-normal text-gray-500">
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
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lastVerse"
                            className="mb-1 block text-sm font-medium text-primary"
                        >
                            Last Verse{' '}
                            <span className="font-normal text-gray-500">
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
                            disabled={!firstVerse}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Assignment Title */}
                <div>
                    <label
                        htmlFor="title"
                        className="mb-1 block text-sm font-medium text-primary"
                    >
                        Assignment Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                        required
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                    {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </button>
            </form>
        </div>
    )
}
