function trimEndToAtMostOneSpace(str: string): string {
    if (str.trimEnd() == str) return str

    return str.trimEnd() + ' '
}

export function splitLineBySpaceOrNewLine(str: string): string[] {
    return trimEndToAtMostOneSpace(str.trimStart()).split(splitBySpaceOrNewLine)
}

function numberOfSpaces(str: string, startIndex = 0) {
    let count = 1
    let i = startIndex + 1

    while (i < str.length && isWhitespace(str[i]!)) {
        count += 1
        i += 1
    }
    return count
}

// Whitespace characters that should be treated as word separators
// Includes regular space, thin space, hair space, narrow no-break space, etc.
function isWhitespace(char: string): boolean {
    const code = char.charCodeAt(0)
    return (
        code === 32 || // Regular space
        code === 8201 || // Thin space \u2009
        code === 8202 || // Hair space \u200A
        code === 8239 || // Narrow no-break space \u202F
        code === 160 // Non-breaking space \u00A0
    )
}

const splitBySpaceOrNewLine = {
    [Symbol.split](str: string) {
        let pos = 0
        const result = []
        while (pos < str.length) {
            if (isWhitespace(str[pos]!)) {
                result.push(' ')
                // Skip consecutive whitespace
                while (pos < str.length && isWhitespace(str[pos]!)) {
                    pos++
                }
            } else if (str[pos] === '\n') {
                result.push('\n')
                pos += 1
            } else if (str[pos] === '[' && str.indexOf(']', pos) !== -1) {
                const indexOfEndOfVerseNumber = str.indexOf(']', pos)

                if (indexOfEndOfVerseNumber !== -1) {
                    result.push(str.substring(pos, indexOfEndOfVerseNumber + 1))
                    pos = indexOfEndOfVerseNumber + 1
                }
            } else {
                const indexOfNewLine = str.indexOf('\n', pos)
                // Find the next whitespace character
                let indexOfSpace = -1
                for (let i = pos; i < str.length; i++) {
                    if (isWhitespace(str[i]!)) {
                        indexOfSpace = i
                        break
                    }
                }
                const endOfWord =
                    indexOfSpace === -1
                        ? indexOfNewLine
                        : indexOfNewLine === -1
                          ? indexOfSpace
                          : Math.min(indexOfNewLine, indexOfSpace)
                if (endOfWord === -1) {
                    // Note omitting the end index argument matches to the end of the string
                    // Negative indexes do not work with substring
                    result.push(str.substring(pos))
                    pos = str.length
                } else {
                    // For regular space, include it in the word (original behavior)
                    // For other whitespace (thin space, etc.), don't include it
                    const whitespaceChar = str[endOfWord]!
                    if (whitespaceChar === ' ') {
                        // Include trailing regular space in word
                        result.push(str.substring(pos, endOfWord + 1))
                        pos = endOfWord + 1
                    } else {
                        // Don't include special whitespace - it will be handled as separator
                        result.push(str.substring(pos, endOfWord))
                        pos = endOfWord
                    }
                }
            }
        }
        return result
    },
}
