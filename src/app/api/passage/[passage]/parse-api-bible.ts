import { JSDOM } from 'jsdom'
import { parseFragment } from 'parse5'
import { ChildNode, Element } from 'parse5/dist/tree-adapters/default'

import { apiBibleIdToBook } from '~/lib/api-bible-book-id'
import { isAtomTyped } from '~/lib/isEqual'
import { isAtomComplete } from '~/lib/keystroke'
import {
    Block,
    Inline,
    ParsedPassage,
    parseNextChapter,
    parsePrevChapter,
    Translation,
    Verse,
    VerseNumber,
    Word,
} from '~/lib/parseEsv'
import { splitLineBySpaceOrNewLine } from '~/lib/splitBySpaceOrNewLine'
import { Book } from '~/lib/types/book'

/**
 * Parses API.Bible HTML response into ParsedPassage format
 * API.Bible HTML structure is different from ESV:
 * - Verse numbers: <span data-number="1" data-sid="GEN 1:1" class="v">1</span>
 * - Section headers: <p class="s1">, <p class="s2">
 * - Paragraphs: <p class="m">, <p class="pmo">, <p class="q1">, <p class="q2">, <p class="li1">, etc.
 * - Cross-references: <p class="r"> (skipped)
 * - Blank paragraphs: <p class="b"> (skipped)
 * - Hebrew letter headers: <p class="qa"> (skipped as headings)
 * - Chapter labels: <p class="cl"> (skipped)
 * - Continuation verses: <p data-vid="GEN 1:5"> (verse continues from previous paragraph)
 * - Verse spans: <span class="verse-span"> (content wrapper, parse children)
 * - Divine names: <span class="nd"> (content, parse children)
 */
export function parseApiBibleChapter(
    passage: string,
    translation: Exclude<Translation, 'esv'> = 'bsb',
): ParsedPassage {
    const dom = new JSDOM(passage)

    const html = parseFragment(dom.serialize())

    const context: {
        lastVerse?: Verse
        firstVerseOfPassage?: VerseNumber
        chapter?: number
        book?: Book
        translation: Exclude<Translation, 'esv'>
    } = {
        translation,
    }

    function getAttr(node: Element, name: string): string | undefined {
        return node.attrs?.find(attr => attr.name === name)?.value
    }

    function hasClass(node: Element, className: string): boolean {
        const classAttr = getAttr(node, 'class')
        return classAttr?.split(' ').includes(className) ?? false
    }

    /**
     * Get the number of leading spaces for poetry indentation.
     * q1/qm1 = 2 spaces (first level), q2/qm2 = 4 spaces (second level)
     * MSG gets double indentation for better readability
     */
    function getPoetryIndent(node: Element): number {
        const offset = translation === 'msg' ? 4 : 0

        if (hasClass(node, 'q2') || hasClass(node, 'qm2')) {
            return 4 + offset
        }
        if (
            hasClass(node, 'q1') ||
            hasClass(node, 'qm1') ||
            hasClass(node, 'q')
        ) {
            return 2 + offset
        }
        return 0
    }

    /**
     * Create leading space atoms for poetry indentation
     */
    function createLeadingSpaces(count: number): Array<{ type: 'space' }> {
        return Array.from({ length: count }, () => ({ type: 'space' }))
    }

    function parseInline(node: ChildNode): Inline[] {
        if (node.nodeName === '#text' && 'value' in node) {
            // Skip leading whitespace - it will be handled by adding space after verse numbers
            // or by other spacing logic
            const wordSegments = splitLineBySpaceOrNewLine(node.value)
            const words =
                wordSegments.length > 0
                    ? wordSegments
                          .filter(word => {
                              // Filter out segments that are just punctuation or whitespace
                              // (e.g., commas from footnote markers)
                              return /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(
                                  word,
                              )
                          })
                          .map((word): Inline => {
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

            return words
        }

        // API.Bible verse numbers: <span data-number="1" data-sid="GEN 1:1" class="v">
        // Also handles verse ranges like: <span data-number="1-2" data-sid="GEN 1:1-2" class="v">
        if (node.nodeName === 'span' && 'attrs' in node) {
            // Skip footnote markers (sup class contains commas/references)
            if (hasClass(node, 'sup')) {
                return []
            }

            const dataSid = getAttr(node, 'data-sid')
            const dataNumber = getAttr(node, 'data-number')

            if (dataSid && dataNumber && hasClass(node, 'v')) {
                // Parse data-sid like "GEN 1:1" or "GEN 1:1-2"
                const parts = dataSid.split(':')
                const bookChapter = parts[0]
                const verseStr = parts[1]

                if (!bookChapter || !verseStr) return []

                const bookParts = bookChapter.split(' ')
                const bookId = bookParts[0]
                const chapterStr = bookParts[1]

                if (!bookId || !chapterStr) return []

                const book = apiBibleIdToBook[bookId]
                const chapter = parseInt(chapterStr)

                // Handle verse ranges like "1-2" - extract first verse number
                const verseMatch = verseStr.match(/^(\d+)/)
                const verse =
                    verseMatch?.[1] != null
                        ? parseInt(verseMatch[1])
                        : parseInt(verseStr)

                if (book) {
                    context.book = book
                    context.chapter = chapter

                    // Include trailing space in text to match ESV output format
                    // (renders as "<b>1 </b>" like ESV does)
                    return [
                        {
                            type: 'verseNumber',
                            value: dataNumber.trim(),
                            text: dataNumber + ' ',
                            verse,
                            chapter,
                            book,
                            translation: context.translation,
                        },
                    ]
                }
            }

            // Regular span, parse children
            if ('childNodes' in node) {
                return node.childNodes.flatMap(parseInline)
            }
        }

        if (node.nodeName === 'br') {
            return [{ type: 'newLine' }]
        }

        // Handle other elements with children
        if ('childNodes' in node && node.childNodes.length > 0) {
            return node.childNodes.flatMap(parseInline)
        }

        return []
    }

    function inlineToString(inlines: Inline[]): string {
        return inlines
            .filter((node): node is Word => node.type === 'word')
            .map(node => node.letters.join(''))
            .join('')
    }

    function parseDataVid(
        dataVid: string,
    ): { book: Book; chapter: number; verse: number } | null {
        // Parse data-vid like "GEN 1:5"
        const parts = dataVid.split(':')
        const bookChapter = parts[0]
        const verseStr = parts[1]

        if (!bookChapter || !verseStr) return null

        const bookParts = bookChapter.split(' ')
        const bookId = bookParts[0]
        const chapterStr = bookParts[1]

        if (!bookId || !chapterStr) return null

        const book = apiBibleIdToBook[bookId]
        if (book) {
            return {
                book,
                chapter: parseInt(chapterStr),
                verse: parseInt(verseStr),
            }
        }
        return null
    }

    type ParsedBlock =
        | Block
        | { type: 'stanzaBreak' }
        | { type: 'poetryLine'; paragraph: Block & { type: 'paragraph' } }

    function parseBlock(node: ChildNode): ParsedBlock | null {
        if (node.nodeName !== 'p') return null
        if (!('attrs' in node)) return null

        const classAttr = getAttr(node, 'class')
        const dataVid = getAttr(node, 'data-vid')

        // Blank paragraphs indicate stanza breaks in poetry
        if (hasClass(node, 'b')) {
            return { type: 'stanzaBreak' }
        }

        // Skip cross-reference paragraphs
        if (hasClass(node, 'r')) {
            return null
        }

        // Hebrew letter headers (qa) - treat as section headers (h4)
        if (hasClass(node, 'qa')) {
            const text = node.childNodes
                .flatMap(parseInline)
                .filter((n): n is Word => n.type === 'word')
                .map(n => n.letters.join(''))
                .join(' ')
            return {
                type: 'h4',
                text,
            }
        }

        // Skip chapter labels (cl)
        if (hasClass(node, 'cl')) {
            return null
        }

        // Section headers: s1 (main title), s2 (subsection)
        if (hasClass(node, 's1')) {
            const text = node.childNodes
                .flatMap(parseInline)
                .filter((node): node is Word => node.type === 'word')
                .map(node => node.letters.join(''))
                .join('')
            return {
                type: 'h2',
                text,
            }
        }

        if (hasClass(node, 's2')) {
            const text = node.childNodes
                .flatMap(parseInline)
                .filter((node): node is Word => node.type === 'word')
                .map(node => node.letters.join(''))
                .join('')
            return {
                type: 'h3',
                text,
            }
        }

        // Regular paragraph or poetry (m, pmo, q1, q2, li1, qm1, qm2, mi, etc.)
        // Also match paragraphs with no class or just data-vid
        const isContentParagraph =
            hasClass(node, 'm') ||
            hasClass(node, 'pmo') ||
            hasClass(node, 'po') || // Opening paragraph (NIV epistles)
            hasClass(node, 'q') || // Poetry (NASB)
            hasClass(node, 'q1') ||
            hasClass(node, 'q2') ||
            hasClass(node, 'qc') || // Centered poetry (CSB)
            hasClass(node, 'pm') ||
            hasClass(node, 'p') ||
            hasClass(node, 'lh') || // List header (NIV)
            hasClass(node, 'li1') ||
            hasClass(node, 'li2') ||
            hasClass(node, 'qm1') ||
            hasClass(node, 'qm2') ||
            hasClass(node, 'mi') ||
            hasClass(node, 'pi') ||
            hasClass(node, 'd') || // Descriptive title
            hasClass(node, 'ms2') || // Manuscript section header (NASB treats as content)
            hasClass(node, 's') || // Simple section header (may contain content)
            dataVid != null || // Continuation paragraph
            classAttr === '' || // Empty class
            classAttr == null // No class attribute

        if (isContentParagraph) {
            const isPoetryLine =
                hasClass(node, 'q') ||
                hasClass(node, 'q1') ||
                hasClass(node, 'q2') ||
                hasClass(node, 'qc') ||
                hasClass(node, 'qm1') ||
                hasClass(node, 'qm2')

            // Get leading spaces for poetry indentation
            const indentSpaces = isPoetryLine
                ? createLeadingSpaces(getPoetryIndent(node))
                : []

            const parsedNodes: Inline[] = node.childNodes.flatMap(parseInline)

            // For poetry lines, insert indentation after verse number (if present) or at start
            let nodes: Inline[]
            if (indentSpaces.length > 0 && parsedNodes.length > 0) {
                // Find the verse number position
                const verseNumIndex = parsedNodes.findIndex(
                    n => n.type === 'verseNumber',
                )
                if (verseNumIndex !== -1) {
                    // Insert spaces after verse number
                    nodes = [
                        ...parsedNodes.slice(0, verseNumIndex + 1),
                        ...indentSpaces,
                        ...parsedNodes.slice(verseNumIndex + 1),
                    ]
                } else {
                    // No verse number, insert at start
                    nodes = [...indentSpaces, ...parsedNodes]
                }
            } else {
                nodes = parsedNodes
            }

            if (inlineToString(nodes).trim() === '') {
                return null
            }

            const verseNumberNodes: number[] = []
            for (const [i, node] of nodes.entries()) {
                if (node.type === 'verseNumber') {
                    verseNumberNodes.push(i)
                }
            }

            const verseSections: Inline[][] = []

            // Check if this is a continuation paragraph (has data-vid but no verse number)
            if (dataVid && verseNumberNodes.length === 0) {
                const parsedVid = parseDataVid(dataVid)
                if (parsedVid && context.lastVerse) {
                    // Note: leading spaces already added to `nodes` above for poetry lines

                    // This is a continuation of a verse
                    const verses: Verse[] = [
                        {
                            type: 'verse',
                            nodes,
                            verse: context.lastVerse.verse,
                            text: inlineToString(nodes),
                            metadata: {
                                hangingVerse: true,
                                offset:
                                    context.lastVerse.metadata.offset +
                                    context.lastVerse.metadata.length,
                                length: nodes.filter(isAtomTyped).length,
                            },
                        },
                    ]

                    context.lastVerse = verses.at(-1)

                    const paragraph = {
                        type: 'paragraph' as const,
                        text: inlineToString(nodes),
                        nodes: verses,
                        metadata: {
                            type: isPoetryLine
                                ? ('quote' as const)
                                : ('default' as const),
                            blockIndent: isPoetryLine,
                        },
                    }

                    // Return as poetry line to enable merging
                    if (isPoetryLine) {
                        return { type: 'poetryLine', paragraph }
                    }
                    return paragraph
                }
            }

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
                    // Skip if we don't have a last verse to continue from
                    continue
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

            if (verses.length === 0) {
                return null
            }

            const isPoetryBlock =
                hasClass(node, 'q') ||
                hasClass(node, 'q1') ||
                hasClass(node, 'q2') ||
                hasClass(node, 'qc') ||
                hasClass(node, 'qm1') ||
                hasClass(node, 'qm2')

            const paragraph = {
                type: 'paragraph' as const,
                text: inlineToString(nodes),
                nodes: verses,
                metadata: {
                    type: isPoetryBlock
                        ? ('quote' as const)
                        : ('default' as const),
                    blockIndent: isPoetryBlock,
                },
            }

            // Return as poetry line to enable merging
            if (isPoetryBlock) {
                return { type: 'poetryLine', paragraph }
            }
            return paragraph
        }

        return null
    }

    const nodes: Block[] = []
    let currentPoetryParagraph: (Block & { type: 'paragraph' }) | null = null

    for (const node of html.childNodes) {
        const parsed = parseBlock(node)

        if (parsed == null) continue

        if (parsed.type === 'stanzaBreak') {
            // Stanza break - finalize current poetry paragraph and start fresh
            if (currentPoetryParagraph) {
                nodes.push(currentPoetryParagraph)
                currentPoetryParagraph = null
            }
            continue
        }

        if (parsed.type === 'poetryLine') {
            if (currentPoetryParagraph) {
                // Merge into current poetry paragraph
                // Add newline to last word of last verse in current paragraph
                const lastVerse =
                    currentPoetryParagraph.nodes[
                        currentPoetryParagraph.nodes.length - 1
                    ]
                if (lastVerse) {
                    lastVerse.nodes.push({ type: 'newLine' })
                }

                // Append verses from new line
                currentPoetryParagraph.nodes.push(...parsed.paragraph.nodes)
                currentPoetryParagraph.text += '\n' + parsed.paragraph.text
            } else {
                // Start new poetry paragraph
                currentPoetryParagraph = parsed.paragraph
            }
            continue
        }

        // Non-poetry block - finalize any current poetry paragraph first
        if (currentPoetryParagraph) {
            nodes.push(currentPoetryParagraph)
            currentPoetryParagraph = null
        }

        nodes.push(parsed)
    }

    // Don't forget to add the last poetry paragraph if we ended with one
    if (currentPoetryParagraph) {
        nodes.push(currentPoetryParagraph)
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
