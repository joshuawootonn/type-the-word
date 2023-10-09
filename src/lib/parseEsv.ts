import { splitBySpaceOrNewLine } from './splitBySpaceOrNewLine'

export const verseRegex = /\s*[[0-9]+\][\S\s]*?(?=[^\S\r\n]*(\[|$))/g
const footnoteRegex = /\([0-9]+\).*?(?=\(|$)/g
const verseNumberRegex = /\[[0-9]+\]/g
const numberRegex = /[0-9]+/g
const footnoteNumberRegex = /\([0-9]+\)/g

export type Word = { type: 'word'; letters: string[] }
export type Atom = { type: 'newLine' } | { type: 'space' } | Word

export type Verse = {
    type: 'verse'
    verse: string
    text: string
    nodes: Atom[]
}

export type Passage =
    | { type: 'newLine' }
    | { type: 'title'; text: string }
    | {
          type: 'paragraph'
          nodes: Verse[]
      }
    | { type: 'footnote'; verse: string; text: string }

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
                    const text = match
                        .replace(verseNumberRegex, '')
                        .replace(footnoteNumberRegex, '')

                    const node: Verse = {
                        type: 'verse' as const,
                        verse: match.match(numberRegex)?.[0] ?? '',
                        text,
                        nodes: text
                            .split(splitBySpaceOrNewLine)
                            .flatMap<Atom>(atomText => {
                                if (atomText === '\n') {
                                    return { type: 'newLine' as const }
                                }

                                if (atomText === ' ') {
                                    return { type: 'space' as const }
                                }

                                return {
                                    type: 'word' as const,
                                    letters: atomText.split(''),
                                }
                            }),
                    }

                    verseNodes.push(node)
                    // console.log(JSON.stringify(node, null, 2))
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
