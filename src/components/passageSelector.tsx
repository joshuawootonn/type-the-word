'use client'

import { Combobox } from '@headlessui/react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import clsx from 'clsx'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import React, {
    ComponentPropsWithoutRef,
    forwardRef,
    Fragment,
    useEffect,
    useRef,
    useState,
} from 'react'
import { z } from 'zod'

import { useIsFirstRender } from '~/lib/hooks/useIsFirstRender'
import { Translation } from '~/lib/parseEsv'
import { stringToPassageObject } from '~/lib/passageObject'
import {
    PassageReference,
    passageReferenceSchema,
} from '~/lib/passageReference'
import { toPassageSegment } from '~/lib/passageSegment'
import { Book, bookSchema } from '~/lib/types/book'

import metadata from '../lib/simple-bible-metadata.json'

export const PASSAGE_BOOK_INPUT_ID = 'passage-book-input'

const simpleBibleMetadataSchema = z.record(
    bookSchema,
    z.object({
        chapters: z.number(),
        name: z.string(),
    }),
)

const simpleBibleMetadata = simpleBibleMetadataSchema.parse(metadata)

const books = Object.keys(metadata) as Book[]

const translations: { value: Translation; label: string }[] = [
    { value: 'esv', label: 'ESV' },
    { value: 'bsb', label: 'BSB' },
]

const ForwardedRefInput = forwardRef(function InnerForwardedRefInput(
    props: ComponentPropsWithoutRef<'input'>,
    ref: React.ForwardedRef<HTMLInputElement>,
) {
    return <input {...props} ref={ref} />
})

function getValues(text: PassageReference | undefined): {
    book: Book
    chapter: string
} {
    const passage = stringToPassageObject.safeParse(text)

    if (passage.success) {
        return {
            book: passage.data.book,
            chapter: passage.data.chapter?.toString() ?? '1',
        }
    }

    return { book: 'genesis', chapter: '1' }
}

export function PassageSelector({
    value,
    label,
    labelClassName,
    initialTranslation = 'esv',
}: {
    label?: string
    value?: PassageReference
    labelClassName?: string
    initialTranslation?: Translation
}) {
    const values = getValues(value)
    const [book, setBook] = useState<Book>(values.book)
    const [chapter, setChapter] = useState<string>(values.chapter)
    const [translation, setTranslation] =
        useState<Translation>(initialTranslation)

    const [bookQuery, setBookQuery] = useState('')
    const [chapterQuery, setChapterQuery] = useState('')
    const [translationQuery, setTranslationQuery] = useState('')

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const chapterRef = useRef<HTMLInputElement>(null)

    const filteredBooks =
        bookQuery === ''
            ? books
            : books.filter(book =>
                  bookQuery
                      .toLowerCase()
                      .split(' ')
                      .every(part => book.toLowerCase().includes(part)),
              )

    const chapters = new Array(simpleBibleMetadata[book]?.chapters ?? 0)
        .fill('')
        .map((_, i) => `${i + 1}`)

    // Sync translation state with URL search params
    useEffect(() => {
        const urlTranslation = searchParams?.get('translation')
        if (urlTranslation === 'bsb' || urlTranslation === 'esv') {
            setTranslation(urlTranslation)
        }
    }, [searchParams])

    useEffect(() => {
        const values = getValues(value)
        setBook(values.book)
        setChapter(values.chapter)
    }, [value])

    useEffect(() => {
        const nextValue = passageReferenceSchema.parse(`${book}_${chapter}`)
        // I use `!includes` to prevent passage selector from clearing url specified verses
        if (!pathname?.includes(nextValue) && pathname !== '/') {
            const t = setTimeout(() => {
                onSubmit({ book, chapter, translation })
            }, 3000)

            return () => {
                clearTimeout(t)
            }
        }
    }, [book, chapter, translation, onSubmit, pathname])

    const filteredChapters =
        chapterQuery === ''
            ? chapters
            : chapters.filter(chapter => {
                  return chapter
                      .toLowerCase()
                      .includes(chapterQuery.toLowerCase())
              })

    const filteredTranslations =
        translationQuery === ''
            ? translations
            : translations.filter(t =>
                  t.label
                      .toLowerCase()
                      .includes(translationQuery.toLowerCase()),
              )

    function onSubmit({
        book,
        chapter,
        translation,
    }: {
        book: Book
        chapter: string
        translation: Translation
    }) {
        setBook(book)
        setChapter(chapter)
        setTranslation(translation)
        const nextUrl = toPassageSegment(book, chapter)

        // Only add translation param if not ESV (default)
        const params = new URLSearchParams()
        if (translation !== 'esv') {
            params.set('translation', translation)
        }
        const queryString = params.toString()

        void router.push(
            `/passage/${nextUrl}${queryString ? `?${queryString}` : ''}`,
            { scroll: false },
        )
    }

    const isFirstRender = useIsFirstRender()

    return (
        <>
            <label htmlFor="passage" className={clsx(labelClassName)}>
                {label ?? 'Passage:'}
            </label>
            <div className={'not-prose svg-outline relative flex flex-row'}>
                <Combobox
                    className="relative"
                    as="div"
                    value={book}
                    onChange={next => {
                        setBook(next)
                    }}
                >
                    <Combobox.Input
                        id={PASSAGE_BOOK_INPUT_ID}
                        onChange={event => setBookQuery(event.target.value)}
                        onFocus={event => {
                            event.currentTarget.select()
                        }}
                        onKeyUp={e => {
                            if (e.key === 'Enter' || e.keyCode === 13) {
                                chapterRef.current?.focus()
                            }
                        }}
                        displayValue={(book: Book) =>
                            simpleBibleMetadata[book]?.name ?? ''
                        }
                        className={
                            'w-44 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none'
                        }
                        autoComplete="false"
                        data-1p-ignore={true}
                    />
                    {/* `ComboBox` from headlessui has to be in a client component, which is why I have to fake the SSR to prevent flickering.*/}
                    {isFirstRender && (
                        <div className="absolute left-1 top-1 translate-x-0.5 translate-y-0.5 font-medium text-primary">
                            {simpleBibleMetadata[book]?.name ?? ''}
                        </div>
                    )}
                    <ScrollArea.Root className="bg-secondary">
                        <ScrollArea.Viewport>
                            <Combobox.Options
                                className={
                                    'absolute z-50 max-h-60 w-full -translate-y-0.5 overflow-auto border-2 border-primary bg-secondary'
                                }
                            >
                                {filteredBooks.map(book => (
                                    <Combobox.Option
                                        key={book}
                                        value={book}
                                        as={Fragment}
                                    >
                                        {({ active }) => (
                                            <li
                                                className={clsx(
                                                    'cursor-pointer px-2 py-1',
                                                    active
                                                        ? 'bg-primary text-secondary '
                                                        : 'bg-secondary text-primary ',
                                                )}
                                                onClick={() => {
                                                    setTimeout(() =>
                                                        chapterRef.current?.focus(),
                                                    )
                                                }}
                                            >
                                                {simpleBibleMetadata[book]
                                                    ?.name ?? book}
                                            </li>
                                        )}
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </ScrollArea.Viewport>{' '}
                        <ScrollArea.Scrollbar orientation="vertical">
                            <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>

                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                            className="h-5 w-5 text-primary "
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </Combobox.Button>
                </Combobox>
                <Combobox
                    as="div"
                    // the translate from the children of this element are not moved here because that creates a new stacking context and negates the z-50 on the options.
                    className="relative"
                    value={chapter}
                    onChange={next => {
                        onSubmit({ book, chapter: next, translation })
                    }}
                >
                    <Combobox.Input
                        ref={chapterRef}
                        as={ForwardedRefInput}
                        onChange={event => setChapterQuery(event.target.value)}
                        onFocus={event => event.currentTarget.select()}
                        onKeyUp={event => {
                            if (event.key === 'Enter' || event.keyCode === 13) {
                                onSubmit({ book, chapter, translation })
                            }
                        }}
                        className={
                            'w-16 -translate-x-0.5 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none '
                        }
                        autoComplete="false"
                        data-1p-ignore={true}
                    />
                    {/* `ComboBox` from headlessui has to be in a client component, which is why I have to fake the SSR to prevent flickering.*/}
                    {isFirstRender && (
                        <div className="absolute left-1 top-1 translate-y-0.5 font-medium text-primary">
                            {chapter}
                        </div>
                    )}
                    <ScrollArea.Root>
                        <ScrollArea.Viewport>
                            <Combobox.Options
                                className={
                                    'absolute z-50 max-h-60 w-full -translate-x-0.5 -translate-y-0.5 overflow-auto border-2 border-primary bg-secondary '
                                }
                            >
                                {filteredChapters.map((number, i) => (
                                    <Combobox.Option
                                        key={i}
                                        value={number}
                                        as={Fragment}
                                    >
                                        {({ active }) => (
                                            <li
                                                className={clsx(
                                                    'cursor-pointer px-2 py-1',
                                                    active
                                                        ? 'bg-primary text-secondary '
                                                        : 'bg-secondary text-primary ',
                                                )}
                                            >
                                                {number}
                                            </li>
                                        )}
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </ScrollArea.Viewport>{' '}
                        <ScrollArea.Scrollbar orientation="vertical">
                            <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>

                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                            className="h-5 w-5 text-primary "
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </Combobox.Button>
                </Combobox>
                {/* Translation Selector */}
                <Combobox
                    as="div"
                    className="relative"
                    value={translation}
                    onChange={next => {
                        onSubmit({ book, chapter, translation: next })
                    }}
                >
                    <Combobox.Input
                        as={ForwardedRefInput}
                        onChange={event =>
                            setTranslationQuery(event.target.value)
                        }
                        onFocus={event => event.currentTarget.select()}
                        displayValue={(t: Translation) =>
                            translations.find(tr => tr.value === t)?.label ?? t
                        }
                        className={
                            'w-16 -translate-x-1 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none'
                        }
                        autoComplete="false"
                        data-1p-ignore={true}
                    />
                    {isFirstRender && (
                        <div className="absolute left-1 top-1 translate-y-0.5 font-medium text-primary">
                            {translations.find(t => t.value === translation)
                                ?.label ?? translation}
                        </div>
                    )}
                    <ScrollArea.Root>
                        <ScrollArea.Viewport>
                            <Combobox.Options
                                className={
                                    'absolute z-50 max-h-60 w-full -translate-x-1 -translate-y-0.5 overflow-auto border-2 border-primary bg-secondary'
                                }
                            >
                                {filteredTranslations.map(t => (
                                    <Combobox.Option
                                        key={t.value}
                                        value={t.value}
                                        as={Fragment}
                                    >
                                        {({ active }) => (
                                            <li
                                                className={clsx(
                                                    'cursor-pointer px-2 py-1',
                                                    active
                                                        ? 'bg-primary text-secondary'
                                                        : 'bg-secondary text-primary',
                                                )}
                                            >
                                                {t.label}
                                            </li>
                                        )}
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar orientation="vertical">
                            <ScrollArea.Thumb />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>

                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                            className="h-5 w-5 text-primary"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </Combobox.Button>
                </Combobox>
            </div>
        </>
    )
}
