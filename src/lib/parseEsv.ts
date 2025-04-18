import { parseFragment } from 'parse5'
import { ChildNode } from 'parse5/dist/tree-adapters/default'
import { isAtomTyped } from '~/lib/isEqual'
import { isAtomComplete } from '~/lib/keystroke'
import { JSDOM } from 'jsdom'
import { Book, bookSchema } from '~/lib/types/book'
import { getBibleMetadata } from '~/server/bibleMetadata'
import { PassageSegment, toPassageSegment } from './passageSegment'
import { PassageReference, passageReferenceSchema } from './passageReference'
import { splitLineBySpaceOrNewLine } from './splitBySpaceOrNewLine'

export type Translation = 'esv'

export type VerseNumber = {
    type: 'verseNumber'
    value: string
    text: string
    verse: number
    chapter: number
    book: Book
    translation: Translation
}

export type Word = { type: 'word'; letters: string[] }

export type Inline =
    | VerseNumber
    | Word
    | { type: 'space' }
    | { type: 'newLine' }

type VerseMetadata = {
    hangingVerse?: boolean
    offset: number
    length: number
}

export type Verse = {
    type: 'verse'
    verse: VerseNumber
    text: string
    nodes: (Paragraph | Inline)[]
    metadata: VerseMetadata
}

export type H1 = {
    type: 'h1'
    text: string
}

export type H2 = {
    type: 'h2'
    text: string
}

export type H3 = {
    type: 'h3'
    text: string
}

export type H4 = {
    type: 'h4'
    text: string
}

export type ParagraphMetadata = {
    type: 'default' | 'quote'
    blockIndent: boolean
}

export type Paragraph = {
    type: 'paragraph'
    text: string
    nodes: Verse[]
    metadata: ParagraphMetadata
}

export type Block = H1 | H2 | H3 | H4 | Verse | Paragraph

function inlineToString(inlines: Inline[]): string {
    return inlines
        .filter((node): node is Word => node.type === 'word')
        .map(node => node.letters.join(''))
        .join('')
}

export type ParsedPassage = {
    nodes: Block[]
    firstVerse: VerseNumber
    prevChapter: {
        url: string
        label: string
    } | null
    nextChapter: {
        url: string
        label: string
    } | null
}

const metadata = getBibleMetadata()

export function parsePrevChapter(
    book: Book,
    chapter: number,
): { url: PassageSegment; label: PassageReference } | null {
    if (chapter > 1) {
        const url = toPassageSegment(book, `${chapter - 1}`)
        return {
            url,
            label: passageReferenceSchema.parse(url),
        }
    }

    const arrayBookMetadata = Object.entries(metadata)
    const currentBookIndex = arrayBookMetadata.findIndex(([b]) => b === book)

    if (currentBookIndex === 0) return null

    const prevBookMetadata = arrayBookMetadata.at(currentBookIndex - 1)

    if (prevBookMetadata) {
        const url = toPassageSegment(
            prevBookMetadata[0],
            `${prevBookMetadata[1].chapters.length}`,
        )

        return {
            url,
            label: passageReferenceSchema.parse(url),
        }
    }

    return null
}

export function parseNextChapter(
    book: Book,
    chapter: number,
): { url: PassageSegment; label: PassageReference } | null {
    const bookMetadata = metadata[book]

    const numberOfBooksInCurrentBook = bookMetadata?.chapters.length ?? 0

    if (chapter < numberOfBooksInCurrentBook) {
        const url = toPassageSegment(book, `${chapter + 1}`)
        return {
            url,
            label: passageReferenceSchema.parse(url),
        }
    }

    const arrayBookMetadata = Object.entries(metadata)
    const nextBookMetadata = arrayBookMetadata.at(
        arrayBookMetadata.findIndex(([b]) => b === book) + 1,
    )

    if (nextBookMetadata) {
        const url = toPassageSegment(nextBookMetadata[0], '1')
        return {
            url,
            label: passageReferenceSchema.parse(url),
        }
    }

    return null
}

export function parseChapter(passage: string): ParsedPassage {
    const dom = new JSDOM(passage)
    dom.window.document.querySelectorAll('sup.footnote').forEach(node => {
        node.parentNode?.removeChild(node)
    })

    const html = parseFragment(dom.serialize())

    const context: {
        lastVerse?: Verse
        firstVerseOfPassage?: VerseNumber
        chapter?: number
        book?: Book
    } = {}

    function parseInline(node: ChildNode): Inline[] {
        if (node.nodeName === '#text' && 'value' in node) {
            const leadingSpaces = new Array<{ type: 'space' }>(
                node.value.length - node.value.trimStart().length,
            ).fill({
                type: 'space',
            })

            const wordSegments = splitLineBySpaceOrNewLine(node.value)
            const words =
                wordSegments.length > 0
                    ? wordSegments.map((word): Inline => {
                          const letters = word.split('')
                          const atom: Word = {
                              type: 'word',
                              letters,
                          }

                          return isAtomComplete(atom)
                              ? atom
                              : { ...atom, letters: [...atom.letters, ' '] }
                      })
                    : []

            return [...leadingSpaces, ...words]
        }

        if (
            node.nodeName === 'b' &&
            node.attrs.find(
                attr =>
                    attr.value.includes('verse-num') ||
                    attr.value.includes('chapter-num'),
            ) != undefined
        ) {
            const numberString = node.childNodes
                .flatMap(parseInline)
                .filter((node): node is Word => node.type === 'word')
                .map(node => node.letters.join(''))
                .join('')

            if (
                node.attrs.find(attr => attr.value.includes('chapter-num')) !=
                undefined
            ) {
                context.chapter = parseInt(numberString.split(':').at(0) ?? '')
            }

            if (context.book == undefined) {
                throw new Error('Attempted to create verse without book')
            }
            if (context.chapter == undefined) {
                throw new Error('Attempted to create verse without chapter')
            }

            return [
                {
                    type: 'verseNumber',
                    value: numberString.trim(),
                    text: numberString,
                    verse: parseInt(numberString.split(':').at(-1) ?? ''),
                    chapter: context.chapter,
                    book: context.book,
                    translation: 'esv',
                },
            ]
        }

        if (node.nodeName === 'br') {
            return [{ type: 'newLine' }]
        }

        if (node.nodeName === 'span' && node.childNodes.length > 0) {
            return node.childNodes.flatMap(parseInline)
        }

        return []
    }

    function parseBlock(node: ChildNode): Block | null {
        if (node.nodeName === 'h2') {
            const text = node.childNodes
                .flatMap(parseInline)
                .filter((node): node is Word => node.type === 'word')
                .map(node => node.letters.join(''))
                .join('')

            if (node.attrs.find(attr => attr.value.includes('extra_text'))) {
                const trimmedText = text.trim().toLowerCase()
                const book = /([0-9])*([A-Za-z ])+(?!([0-9:]))/
                    .exec(trimmedText)
                    ?.at(0)
                const chapter = /(?<=[0-9a-zA-Z] )([0-9: -])*/
                    .exec(trimmedText)
                    ?.at(0)

                context.book = bookSchema.parse(book?.split(' ').join('_'))
                context.chapter = chapter ? parseInt(chapter) : undefined
            }
            return {
                type: 'h2',
                text: text,
            }
        }
        if (node.nodeName === 'h3') {
            return {
                type: 'h3',
                text: node.childNodes
                    .flatMap(parseInline)
                    .filter((node): node is Word => node.type === 'word')
                    .map(node => node.letters.join(''))
                    .join(''),
            }
        }
        if (node.nodeName === 'h4') {
            return {
                type: 'h4',
                text: node.childNodes
                    .flatMap(parseInline)
                    .filter((node): node is Word => node.type === 'word')
                    .map(node => node.letters.join(''))
                    .join(''),
            }
        }
        if (node.nodeName === 'p' && node.childNodes.length > 0) {
            const nodes: Inline[] = node.childNodes.flatMap(parseInline)

            if (inlineToString(nodes) === '( ) ') {
                return null
            }

            const verseNumberNodes: number[] = []
            for (const [i, node] of nodes.entries()) {
                if (node.type === 'verseNumber') {
                    verseNumberNodes.push(i)
                }
            }

            const verseSections: Inline[][] = []

            if (verseNumberNodes.length === 0) {
                verseSections.push(nodes)
            } else {
                const firstSection = nodes.slice(0, verseNumberNodes.at(0))
                if (firstSection.length > 0) {
                    verseSections.push(firstSection)
                }
                for (const [i, index] of verseNumberNodes.entries()) {
                    verseSections.push(
                        nodes.slice(index, verseNumberNodes.at(i + 1)),
                    )
                }
            }

            const verses: Verse[] = []
            for (const [i, verseSection] of verseSections.entries()) {
                const firstWordIndex = verseSection.findIndex(
                    a => a.type === 'word',
                )
                const verseIndex = verseSection.findIndex(
                    a => a.type === 'verseNumber',
                )
                const continuingVerse =
                    i === 0 &&
                    (verseIndex === -1 || verseIndex > firstWordIndex)

                if (verseSection.every(inline => inline.type === 'space')) {
                    // noop
                } else if (continuingVerse && context?.lastVerse == undefined) {
                    throw new Error(
                        'continuing prev verse but verseMetadata is undefined',
                    )
                } else if (continuingVerse && context?.lastVerse) {
                    verses.push({
                        type: 'verse',
                        nodes: verseSection,
                        verse: context.lastVerse.verse,
                        text: inlineToString(verseSection),
                        metadata: {
                            hangingVerse: true,
                            offset:
                                context.lastVerse.metadata.offset +
                                context.lastVerse.metadata.length,
                            length: verseSection.filter(isAtomTyped).length,
                        },
                    })
                } else {
                    verses.push({
                        type: 'verse',
                        nodes: verseSection,
                        verse: verseSection.at(verseIndex) as VerseNumber,
                        text: inlineToString(verseSection),
                        metadata: {
                            hangingVerse: false,
                            offset: 0,
                            length: verseSection.filter(isAtomTyped).length,
                        },
                    })
                }

                if (
                    context.firstVerseOfPassage == undefined &&
                    verseIndex !== -1
                ) {
                    context.firstVerseOfPassage = verseSection.at(
                        verseIndex,
                    ) as VerseNumber
                }
                context.lastVerse = verses.at(-1)
            }

            return {
                type: 'paragraph',
                text: inlineToString(nodes),
                nodes: verses,
                metadata: {
                    type:
                        node.attrs.find(
                            attr =>
                                attr.value.includes('block-indent') ||
                                attr.value.includes('same-paragraph'),
                        ) != undefined
                            ? 'quote'
                            : 'default',
                    blockIndent:
                        node.attrs.find(attr =>
                            attr.value.includes('block-indent'),
                        ) != undefined,
                },
            }
        }

        return null
    }

    const nodes: Block[] = []
    for (const node of html.childNodes) {
        const parsed = parseBlock(node)

        if (parsed == null) continue

        nodes.push(parsed)
    }
    if (context.book == undefined) {
        throw new Error('book is undefined')
    }
    if (context.chapter == undefined) {
        throw new Error('chapter is undefined')
    }
    if (context.firstVerseOfPassage == undefined) {
        throw new Error('firstVerse is undefined')
    }

    return {
        nodes,
        firstVerse: context.firstVerseOfPassage,
        prevChapter: parsePrevChapter(context.book, context.chapter),
        nextChapter: parseNextChapter(context.book, context.chapter),
    }
}
