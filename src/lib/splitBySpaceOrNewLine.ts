function trimEndToAtMostOneSpace(str: string): string {
    if (str.trimEnd() == str) return str

    return str.trimEnd() + ' '
}

export function splitLineBySpaceOrNewLine(str: string): string[] {
    return trimEndToAtMostOneSpace(str.trimStart()).split(splitBySpaceOrNewLine)
}

function numberOfSpaces(str: string, startIndex = 0) {
    let numberOfSpaces = 1
    let i = startIndex + 1

    while (str[i] === ' ') {
        numberOfSpaces += 1
        i += 1
    }
    return numberOfSpaces
}

const splitBySpaceOrNewLine = {
    [Symbol.split](str: string) {
        let pos = 0
        const result = []
        while (pos < str.length) {
            if (str[pos] === ' ') {
                result.push(' ')
                pos += numberOfSpaces(str, pos)
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
                const indexOfSpace = str.indexOf(' ', pos)
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
                    result.push(str.substring(pos, endOfWord + 1))
                    pos = endOfWord + 1
                }
            }
        }
        return result
    },
}
