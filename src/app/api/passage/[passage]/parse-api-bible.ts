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
    copyrightText = '',
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
            const result: Inline[] = []
            let textValue = node.value

            // Check for pilcrow (¶) at the start - emit as decoration atom
            // This appears in some NASB Psalms as a paragraph marker
            if (textValue.startsWith('¶')) {
                result.push({ type: 'decoration', text: '¶' })
                textValue = textValue.slice(1)
            }

            // Skip leading whitespace - it will be handled by adding space after verse numbers
            // or by other spacing logic
            const wordSegments = splitLineBySpaceOrNewLine(textValue)
            const words =
                wordSegments.length > 0
                    ? wordSegments
                          .filter(word => {
                              const hasAlphanumeric =
                                  /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(
                                      word,
                                  )

                              if (hasAlphanumeric) {
                                  // Has letters/numbers: keep it
                                  return true
                              }

                              // No alphanumeric: only keep if it contains quote characters
                              // This preserves opening quotes like " but filters out markers like *
                              const hasQuote =
                                  /[\u0022\u0027\u201C\u201D\u2018\u2019]/.test(
                                      word,
                                  )
                              return hasQuote
                          })
                          .map((word): Inline => {
                              const letters = word.split('')
                              const atom: Word = {
                                  type: 'word',
                                  letters,
                              }

                              // Don't add trailing space to punctuation-only words
                              // (quotes, etc. should attach to the following word)
                              const hasAlphanumeric =
                                  /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(
                                      word,
                                  )

                              if (!hasAlphanumeric) {
                                  // Punctuation-only: don't add trailing space
                                  return atom
                              }

                              return isAtomComplete(atom)
                                  ? atom
                                  : { ...atom, letters: [...atom.letters, ' '] }
                          })
                    : []

            return [...result, ...words]
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

    /**
     * Merge adjacent Word atoms that should be a single word.
     * This handles cases like NASB small caps where "B" and "lessed" are in separate spans.
     *
     * The HTML structure looks like: <span>"B</span><span class="sc">lessed is</span>
     * This gets parsed as: ['"B '] and ['lessed ', 'is ', ...]
     *
     * We detect the small caps pattern specifically:
     * - Previous word is SHORT (1-2 letters, possibly with leading punctuation)
     * - Previous word ends with an UPPERCASE letter + artificial trailing space
     * - Current word starts with a lowercase letter (continuation)
     *
     * Examples to merge:
     * - "B " + "lessed " → "Blessed " (small caps split)
     * - "O " + "ne " → "One "
     * - "L " + "ord " → "Lord "
     *
     * Examples NOT to merge:
     * - "lessed " + "is " → keep separate (normal word boundary)
     */
    function mergeAdjacentWords(nodes: Inline[]): Inline[] {
        const result: Inline[] = []

        for (const current of nodes) {
            if (current.type !== 'word') {
                result.push(current)
                continue
            }

            // Check if this word should be merged with the previous word
            const lastResult = result[result.length - 1]
            const firstLetter = current.letters[0]

            // Check if previous word is an opening quote that should attach to current word
            // Pattern: previous word is quote-only, current word starts with a letter
            // This check runs even for single-character previous words
            if (lastResult?.type === 'word' && lastResult.letters.length >= 1) {
                const lastResultStr = lastResult.letters.join('')
                const isOpeningQuote =
                    /^[\u201C\u2018"']+$/.test(lastResultStr.trim()) &&
                    firstLetter &&
                    /[a-zA-Z]/.test(firstLetter)

                if (isOpeningQuote) {
                    // Prepend the opening quote to the current word
                    current.letters.unshift(...lastResult.letters)
                    // Remove the opening quote from result (it's now merged)
                    result.pop()
                    result.push(current)
                    continue
                }
            }

            if (lastResult?.type === 'word' && lastResult.letters.length >= 2) {
                const lastLetter =
                    lastResult.letters[lastResult.letters.length - 1]
                const secondToLastLetter =
                    lastResult.letters[lastResult.letters.length - 2]

                // Count actual letters (not punctuation or space) in previous word
                const actualLetters = lastResult.letters.filter(l =>
                    /[a-zA-Z]/.test(l),
                )

                // Merge if:
                // 1. Previous word ends with space (artificial trailing space)
                // 2. Previous word's second-to-last char is an UPPERCASE letter
                // 3. Previous word has only 1-2 actual letters (short prefix)
                // 4. Current word starts with a lowercase letter (continuation)
                // 5. Previous word is NOT a complete English word (like "I" or "A")

                // Don't merge if the second-to-last letter is "I" or "A" (complete English words)
                // This handles cases like:
                // - "I " + "say" → don't merge (pronoun)
                // - '"I ' + "say" → don't merge (quoted pronoun)
                // - "B " + "lessed" → merge (small caps divine name)
                const isCompleteWord =
                    secondToLastLetter === 'I' || secondToLastLetter === 'A'

                if (
                    lastLetter === ' ' &&
                    secondToLastLetter &&
                    /[A-Z]/.test(secondToLastLetter) &&
                    actualLetters.length <= 2 &&
                    firstLetter &&
                    /^[a-z]/.test(firstLetter) &&
                    !isCompleteWord
                ) {
                    // Remove the artificial trailing space and merge
                    lastResult.letters.pop()
                    lastResult.letters.push(...current.letters)
                    continue
                }

                // Check if current word is a closing quote that should attach to previous word
                // Two patterns:
                // 1. Previous word ends with punctuation + space (e.g., "it. "), current is quote-only
                // 2. Previous word ends with letter + space (e.g., "yourself "), current is punct+quote (e.g., ".")
                const currentWordStr = current.letters.join('')
                const currentTrimmed = currentWordStr.trim()

                // Pattern 1: quote-only after punctuation (e.g., it. + " → it." or me.' + " → me.'")
                // Include quotes in punctuation check to handle nested quotes like 'word.'" or "word.'"
                const isQuoteOnlyAfterPunct =
                    /^[\u201D\u2019"']+$/.test(currentTrimmed) &&
                    lastLetter === ' ' &&
                    /[.!?,;:'"'\u2018\u2019\u201C\u201D]/.test(
                        secondToLastLetter ?? '',
                    )

                // Pattern 2: punct+quote after word (e.g., yourself + ." → yourself.")
                const isPunctPlusQuote =
                    /^[.!?,;:]+[\u201D\u2019"']+$/.test(currentTrimmed) &&
                    lastLetter === ' '

                if (isQuoteOnlyAfterPunct || isPunctPlusQuote) {
                    // Remove the trailing space, append the closing quote
                    lastResult.letters.pop()
                    lastResult.letters.push(...current.letters)
                    // Only add trailing space if the merged word doesn't already have one
                    const lastChar =
                        lastResult.letters[lastResult.letters.length - 1]
                    if (lastChar !== ' ' && lastChar !== '\n') {
                        lastResult.letters.push(' ')
                    }
                    continue
                }
            }

            result.push(current)
        }

        return result
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
                .map(n => n.letters.join('').trim())
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

        // Speaker labels: sp (e.g., "She", "Friends" in Song of Solomon)
        // Section headers: s (e.g., "The Banquet", "Solomon's Love for a Shulamite Girl")
        // These are headings indicating who is speaking or section titles, not typeable content
        if (hasClass(node, 'sp') || hasClass(node, 's')) {
            const text = node.childNodes
                .flatMap(parseInline)
                .filter((n): n is Word => n.type === 'word')
                .map(n => n.letters.join('').trim())
                .join(' ')
            return {
                type: 'h4',
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

            const parsedNodes: Inline[] = mergeAdjacentWords(
                node.childNodes.flatMap(parseInline),
            )

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
                const lastVerse =
                    currentPoetryParagraph.nodes[
                        currentPoetryParagraph.nodes.length - 1
                    ]
                const firstNewVerse = parsed.paragraph.nodes[0]

                // Check if we should merge with the last verse (same verse number)
                if (
                    lastVerse &&
                    firstNewVerse &&
                    lastVerse.verse.verse === firstNewVerse.verse.verse
                ) {
                    // Same verse - merge content into existing verse section
                    lastVerse.nodes.push({ type: 'newLine' })
                    lastVerse.nodes.push(...firstNewVerse.nodes)
                    // Update the verse text to include the merged content
                    lastVerse.text += '\n' + firstNewVerse.text
                    // Update the length to include merged nodes
                    lastVerse.metadata.length =
                        lastVerse.nodes.filter(isAtomTyped).length

                    // Add any remaining verses from the new line
                    for (let i = 1; i < parsed.paragraph.nodes.length; i++) {
                        currentPoetryParagraph.nodes.push(
                            parsed.paragraph.nodes[i]!,
                        )
                    }
                } else {
                    // Different verse - add newline and append as new verse section
                    if (lastVerse) {
                        lastVerse.nodes.push({ type: 'newLine' })
                    }
                    currentPoetryParagraph.nodes.push(...parsed.paragraph.nodes)
                }
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
        copyright: {
            text: copyrightText,
            abbreviation: translation.toUpperCase(),
            translation,
        },
    }
}
