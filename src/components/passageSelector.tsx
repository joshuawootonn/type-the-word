import { useRouter } from 'next/router'
import React, {
    ComponentPropsWithoutRef,
    forwardRef,
    Fragment,
    useEffect,
    useRef,
    useState,
} from 'react'
import { Combobox } from '@headlessui/react'
import metadata from '../lib/simple-bible-metadata.json'
import { z } from 'zod'
import clsx from 'clsx'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import {
    PassageReference,
    passageReferenceSchema,
} from '~/lib/passageReference'
import { stringToPassageObject } from '~/lib/passageObject'
import { Book, bookSchema } from '~/lib/types/book'

const simpleBibleMetadataSchema = z.record(
    bookSchema,
    z.object({
        chapters: z.number(),
        name: z.string(),
    }),
)

const simpleBibleMetadata = simpleBibleMetadataSchema.parse(metadata)

const books = Object.keys(metadata) as Book[]

const ForwardedRefInput = forwardRef(function InnerForwardedRefInput(
    props: ComponentPropsWithoutRef<'input'>,
    ref: React.ForwardedRef<HTMLInputElement>,
) {
    return <input {...props} ref={ref} />
})

function getInitialValues(text: PassageReference): {
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
    setValue,
}: {
    value: PassageReference
    setValue: (value: PassageReference) => void
}) {
    const initialValues = getInitialValues(value)
    const [book, setBook] = useState<Book>(initialValues.book)
    const [chapter, setChapter] = useState<string>(initialValues.chapter)

    const [bookQuery, setBookQuery] = useState('')
    const [chapterQuery, setChapterQuery] = useState('')

    const { push } = useRouter()

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

    useEffect(() => {
        const nextUrl = `${book}_${chapter}`
        const nextValue = passageReferenceSchema.parse(nextUrl)
        // I use `!includes` to prevent passage selector from clearing url specified verses
        if (!value.includes(nextValue)) {
            const t = setTimeout(() => {
                onSubmit({ book, chapter })
            }, 3000)

            return () => {
                clearTimeout(t)
            }
        }
    }, [book, chapter, push, setValue, value])

    const filteredChapters =
        chapterQuery === ''
            ? chapters
            : chapters.filter(chapter => {
                  return chapter
                      .toLowerCase()
                      .includes(chapterQuery.toLowerCase())
              })

    function onSubmit({ book, chapter }: { book: Book; chapter: string }) {
        setBook(book)
        setChapter(chapter)
        const nextUrl = `${book}_${chapter}`
        const nextValue = passageReferenceSchema.parse(nextUrl)
        setValue(nextValue)
        void push(`/passage/${nextUrl}`)
    }

    return (
        <>
            <label htmlFor="passage" className="text-lg font-medium text-black dark:text-white">
                Passage:
            </label>
            <div className={'not-prose svg-outline relative flex flex-row '}>
                <Combobox
                    className="relative z-40"
                    as="div"
                    value={book}
                    onChange={next => {
                        setBook(next)
                    }}
                >
                    <Combobox.Input
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
                            'w-40 rounded-none border-2 border-black p-1 font-medium outline-none'
                        }
                    />
                    <ScrollArea.Root>
                        <ScrollArea.Viewport>
                            <Combobox.Options
                                className={
                                    'absolute z-10 max-h-60 w-full -translate-y-0.5 overflow-auto border-2 border-black bg-white dark:bg-black'
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
                                                        ? 'bg-black text-white'
                                                        : 'bg-white text-black',
                                                )}
                                                onClick={e => {
                                                    setTimeout(
                                                        () =>
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
                            className="h-5 w-5 text-black"
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
                    className="relative z-40 -translate-x-0.5"
                    value={chapter}
                    onChange={next => {
                        onSubmit({ book, chapter: next })
                    }}
                >
                    <Combobox.Input
                        ref={chapterRef}
                        as={ForwardedRefInput}
                        onChange={event => setChapterQuery(event.target.value)}
                        onFocus={event => event.currentTarget.select()}
                        onKeyUp={event => {
                            if (event.key === 'Enter' || event.keyCode === 13) {
                                onSubmit({ book, chapter })
                            }
                        }}
                        className={
                            'w-16 rounded-none border-2 border-black p-1 font-medium outline-none'
                        }
                    />
                    <ScrollArea.Root>
                        <ScrollArea.Viewport>
                            <Combobox.Options
                                className={
                                    'absolute z-10 max-h-60 w-full -translate-y-0.5 overflow-auto border-2 border-black bg-white'
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
                                                        ? 'bg-black text-white'
                                                        : 'bg-white text-black',
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
                            className="h-5 w-5 text-black"
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
