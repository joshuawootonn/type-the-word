import { splitBySpaceOrNewLine } from './splitBySpaceOrNewLine'

export const verseRegex = /\s*[[0-9]+\][\S\s]*?(?=(\[|$))/g
export const footnoteRegex = /^\([0-9]+\)[\S\s]*?(?=\(|$)/
const verseNumberRegex = /\[[0-9]+\]/
const numberRegex = /[0-9]+/
const footnoteNumberRegex = /\([0-9]+\)/

export type InlineNewLine = { type: 'newLine'; typed: boolean }

export type Space = { type: 'space'; typed: boolean; endOfLine: boolean }

export type VerseNumber = { type: 'verseNumber'; number: string }

export type Word = { type: 'word'; letters: string[] }

export type Atom = InlineNewLine | Space | VerseNumber | Word

export type Verse = {
    type: 'verse'
    verse: string
    text: string
    nodes: Atom[]
}

export type Title = {
    type: 'title'
    text: string
}

export type Newline = {
    type: 'newLine'
}

export type Paragraph = {
    type: 'paragraph'
    nodes: Verse[]
}

export type FootNote = {
    type: 'footnote'
    verse: string
    text: string
}

export type Passage = Newline | Title | Paragraph | FootNote

export function parseChapter(passage: string): Passage[] {
    return passage
        .replace('(ESV)', '')
        .split('\n\n')
        .flatMap((line): Passage[] => {
            if (line === '') {
                return []
            } else if (verseRegex.test(line)) {
                const verseNodes = []
                for (const match of line.match(verseRegex) ?? []) {
                    const text = match.replace(footnoteNumberRegex, '')

                    const splitText = text.split(splitBySpaceOrNewLine)

                    const node: Verse = {
                        type: 'verse' as const,
                        verse: match.match(numberRegex)?.[0] ?? '',
                        text,
                        nodes: splitText.flatMap<Atom>((atomText, i) => {
                            const prevCharIsNewlineOrSpace =
                                splitText.at(i - 1) === ' ' ||
                                splitText.at(i - 1) === '\n' ||
                                verseNumberRegex.test(splitText.at(i - 1) ?? '')
                            if (atomText === '\n') {
                                return {
                                    type: 'newLine' as const,
                                    typed: prevCharIsNewlineOrSpace
                                        ? false
                                        : true,
                                }
                            }

                            if (atomText === ' ') {
                                const ifTrimStart = splitText
                                    .slice(0, i)
                                    .every(atom => atom === ' ')

                                const prevDifferentChar = splitText
                                    .slice(0, i)
                                    .reverse()
                                    .find(atom => atom !== ' ')
                                const nextDifferentChar = splitText
                                    .slice(i)
                                    .find(atom => atom !== ' ')

                                const isSandwichedWithNewLines =
                                    prevDifferentChar === '\n' &&
                                    nextDifferentChar === '\n'

                                return {
                                    type: 'space' as const,
                                    typed:
                                        prevCharIsNewlineOrSpace ||
                                        ifTrimStart ||
                                        prevDifferentChar === '\n' ||
                                        isSandwichedWithNewLines
                                            ? false
                                            : true,
                                }
                            }

                            if (verseNumberRegex.test(atomText)) {
                                return {
                                    type: 'verseNumber' as const,
                                    number: match.match(numberRegex)?.[0] ?? '',
                                }
                            }

                            return {
                                type: 'word' as const,
                                letters: atomText.split(''),
                            }
                        }),
                    }

                    verseNodes.push(node)
                }

                return [{ type: 'paragraph' as const, nodes: verseNodes }]
            } else if (footnoteRegex.test(line)) {
                const footnoteNodes = []
                for (const match of line.match(footnoteRegex) ?? []) {
                    footnoteNodes.push({
                        type: 'footnote' as const,
                        verse: match.match(footnoteNumberRegex)?.[0] ?? '',
                        text: match
                            .replace(verseNumberRegex, '')
                            .replace(footnoteNumberRegex, ''),
                    })
                }

                return footnoteNodes
            } else {
                return [{ type: 'title' as const, text: line }]
            }
            return []
        })
}
