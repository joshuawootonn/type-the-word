import { parseFragment } from 'parse5'
import { ChildNode, DocumentFragment } from 'parse5/dist/tree-adapters/default'
import { isAtomTyped } from '~/lib/isEqual'
import { splitBySpaceOrNewLine } from '~/lib/splitBySpaceOrNewLine'
import { isAtomComplete } from '~/lib/keystroke'
import { JSDOM } from 'jsdom'

export type VerseNumber = { type: 'verseNumber'; value: string; text: string }

export type Word = { type: 'word'; letters: string[] }

export type Inline =
    | VerseNumber
    | Word
    | { type: 'space' }
    | { type: 'newLine' }

export type Verse = {
    type: 'verse'
    verse: VerseNumber
    text: string
    nodes: (Paragraph | Inline)[]
    verseMetadata: VerseMetadata
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

export type Paragraph = {
    type: 'paragraph'
    text: string
    nodes: Verse[]
    paragraphMetadata: ParagraphMetadata
}

export type Block = H1 | H2 | H3 | H4 | Verse | Paragraph

function parseInline(node: ChildNode): Inline[] {
    if (node.nodeName === '#text' && 'value' in node) {
        const leadingSpaces = node.value.length - node.value.trimStart().length
        const words = node.value
            .trimStart()
            .split(splitBySpaceOrNewLine)
            .filter(word => word !== '' && word !== ' ' && word !== '\n')

        if (words.length === 0) {
            return []
        }
        const leading = new Array<{ type: 'space' }>(leadingSpaces).fill({
            type: 'space',
        })

        return [
            ...leading,
            ...words.map((word): Inline => {
                const atom: Word = {
                    type: 'word',
                    letters: [...word.split('')],
                }

                if (isAtomComplete(atom)) {
                    return atom
                } else {
                    return {
                        ...atom,
                        letters: [...atom.letters, ' '],
                    }
                }
            }),
        ]
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

        return [
            {
                type: 'verseNumber',
                value: numberString.trim(),
                text: numberString,
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

function inlineToString(inlines: Inline[]): string {
    return inlines
        .filter((node): node is Word => node.type === 'word')
        .map(node => node.letters.join(''))
        .join('')
}
type VerseMetadata = {
    hangingVerse?: boolean
    offset: number
    length: number
}

type ParagraphMetadata = {
    lastVerse: Verse
    firstVerse: Verse
}

function parseBlock(
    node: ChildNode,
    paragraphMetadata?: ParagraphMetadata,
): Block | null {
    if (node.nodeName === 'h2') {
        return {
            type: 'h2',
            text: node.childNodes
                .flatMap(parseInline)
                .filter((node): node is Word => node.type === 'word')
                .map(node => node.letters.join(''))
                .join(''),
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
    if (node.nodeName === 'p') {
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

        let isVerseHanging = false
        const verses: Verse[] = []
        for (const [i, verseSection] of verseSections.entries()) {
            const firstWordIndex = verseSection.findIndex(
                a => a.type === 'word',
            )
            const verseIndex = verseSection.findIndex(
                a => a.type === 'verseNumber',
            )
            const continuingVerse =
                i === 0 && (verseIndex === -1 || verseIndex > firstWordIndex)

            if (continuingVerse && paragraphMetadata?.lastVerse == undefined) {
                throw new Error(
                    'continuing prev verse but verseMetadata is undefined',
                )
            } else if (continuingVerse && paragraphMetadata?.lastVerse) {
                isVerseHanging = true
                verses.push({
                    type: 'verse',
                    nodes: verseSection,
                    verse: paragraphMetadata.lastVerse.verse,
                    text: inlineToString(verseSection),
                    verseMetadata: {
                        hangingVerse: true,
                        offset:
                            paragraphMetadata.lastVerse.verseMetadata.offset +
                            paragraphMetadata.lastVerse.verseMetadata.length,
                        length: verseSection.length,
                    },
                })
            } else {
                verses.push({
                    type: 'verse',
                    nodes: verseSection,
                    verse: verseSection.at(verseIndex) as VerseNumber,
                    text: inlineToString(verseSection),
                    verseMetadata: {
                        hangingVerse: false,
                        offset: 0,
                        length: verseSection.filter(isAtomTyped).length,
                    },
                })
            }
        }

        const firstVerse = verses.at(0)
        const lastVerse = verses.at(-1)

        if (firstVerse == undefined) {
            throw new Error('firstNode is undefined')
        }
        if (lastVerse == undefined) {
            throw new Error('lastNode is undefined')
        }

        return {
            type: 'paragraph',
            paragraphMetadata: {
                firstVerse: firstVerse,
                lastVerse: lastVerse,
            },
            text: inlineToString(nodes),
            nodes: verses,
        }
    }

    return null
}

export type ParsedPassage = {
    nodes: Block[]
    firstVerse: VerseNumber
}

export function parseChapter(passage: string): ParsedPassage {
    const dom = new JSDOM(passage)
    dom.window.document.querySelectorAll('sup.footnote').forEach(node => {
        node.parentNode?.removeChild(node)
    })
    const cleanPassage = dom.serialize()
    const html = parseFragment(cleanPassage)

    let firstVerse: VerseNumber | undefined = undefined
    let previousVerseMetadata: ParagraphMetadata | undefined = undefined
    const nodes: Block[] = []
    for (const node of html.childNodes) {
        const parsed = parseBlock(node, previousVerseMetadata)

        if (parsed == null) continue

        nodes.push(parsed)
        if (parsed.type === 'paragraph') {
            previousVerseMetadata = parsed.paragraphMetadata
            if (firstVerse == undefined && parsed.paragraphMetadata.firstVerse)
                firstVerse = parsed.paragraphMetadata.firstVerse.verse
        }
    }

    if (firstVerse == undefined) {
        throw new Error('firstVerse is undefined')
    }

    return { nodes, firstVerse }
}
