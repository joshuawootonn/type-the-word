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
    verseMetadata?: VerseMetadata
    nodes: Verse[]
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
    offset: number
    length: number
    prevVerse: VerseNumber
}

function parseBlock(
    node: ChildNode,
    verseMetadata?: VerseMetadata,
): { nodes: Block[]; verseMetadata?: VerseMetadata } {
    if (node.nodeName === 'h2') {
        return {
            verseMetadata,
            nodes: [
                {
                    type: 'h2',
                    text: node.childNodes
                        .flatMap(parseInline)
                        .filter((node): node is Word => node.type === 'word')
                        .map(node => node.letters.join(''))
                        .join(''),
                },
            ],
        }
    }
    if (node.nodeName === 'h3') {
        return {
            verseMetadata,
            nodes: [
                {
                    type: 'h3',
                    text: node.childNodes
                        .flatMap(parseInline)
                        .filter((node): node is Word => node.type === 'word')
                        .map(node => node.letters.join(''))
                        .join(''),
                },
            ],
        }
    }
    if (node.nodeName === 'h4') {
        return {
            verseMetadata,
            nodes: [
                {
                    type: 'h4',
                    text: node.childNodes
                        .flatMap(parseInline)
                        .filter((node): node is Word => node.type === 'word')
                        .map(node => node.letters.join(''))
                        .join(''),
                },
            ],
        }
    }
    if (node.nodeName === 'p') {
        const nodes: Inline[] = node.childNodes.flatMap(parseInline)

        if (inlineToString(nodes) === '( ) ') {
            return { verseMetadata, nodes: [] }
        }

        const verseNumberNodes: number[] = []
        for (const [i, node] of nodes.entries()) {
            if (node.type === 'verseNumber') {
                verseNumberNodes.push(i)
            }
        }

        const verses: Verse[] = []
        for (const [i, index] of verseNumberNodes.entries()) {
            const verseNodes = nodes.slice(
                index,
                verseNumberNodes.at(i + 1) ?? -1,
            )

            const continuingVerse =
                i === 0 && index > nodes.findIndex(a => a.type === 'word')

            if (continuingVerse && verseMetadata?.prevVerse == undefined) {
                throw new Error(
                    'continuing prev verse but verseMetadata is undefined',
                )
            } else if (continuingVerse && verseMetadata?.prevVerse) {
                verses.push({
                    type: 'verse',
                    nodes: verseNodes,
                    verse: verseMetadata.prevVerse,
                    text: inlineToString(verseNodes),
                })
            } else {
                verses.push({
                    type: 'verse',
                    nodes: verseNodes,
                    verse: verseNodes.at(0) as VerseNumber,
                    text: inlineToString(verseNodes),
                })
            }
        }

        if (verses.length === 0) {
            if (verseMetadata == undefined) {
                throw new Error('prevVerse is undefined')
            }
            return {
                verseMetadata: {
                    offset: verseMetadata.offset + verseMetadata.length,
                    length: nodes.length,
                    prevVerse: verseMetadata.prevVerse,
                },
                nodes: [
                    {
                        type: 'paragraph',
                        text: inlineToString(nodes),
                        verseMetadata: {
                            offset: verseMetadata.offset + verseMetadata.length,
                            length: nodes.length,
                            prevVerse: verseMetadata.prevVerse,
                        },
                        nodes: [
                            {
                                type: 'verse',
                                nodes,
                                verse: verseMetadata.prevVerse,
                                text: inlineToString(nodes),
                            },
                        ],
                    },
                ],
            }
        }

        const lastNode = verses.at(-1)

        if (lastNode == undefined) {
            throw new Error('lastNode is undefined')
        }

        const numberOfWords = lastNode.nodes.filter(isAtomTyped).length

        return {
            verseMetadata: {
                offset: 0,
                length: numberOfWords,
                prevVerse: lastNode.verse,
            },
            nodes: [
                {
                    type: 'paragraph',
                    text: inlineToString(nodes),
                    verseMetadata: {
                        offset: 0,
                        length: numberOfWords,
                        prevVerse: lastNode.verse,
                    },
                    nodes: verses,
                },
            ],
        }
    }

    return { verseMetadata, nodes: [] }
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
    // const html = parseFragment(passage)

    let firstVerse: VerseNumber | undefined = undefined
    let previousVerseMetadata: VerseMetadata | undefined = undefined
    const nodes: Block[] = []
    for (const node of html.childNodes) {
        const parsed = parseBlock(node, previousVerseMetadata)

        if (
            parsed.verseMetadata?.prevVerse != undefined &&
            previousVerseMetadata == undefined
        ) {
            firstVerse = parsed.verseMetadata.prevVerse
        }

        previousVerseMetadata = parsed.verseMetadata
        nodes.push(...parsed.nodes)
    }

    if (firstVerse == undefined) {
        throw new Error('firstVerse is undefined')
    }

    return { nodes, firstVerse }
}
