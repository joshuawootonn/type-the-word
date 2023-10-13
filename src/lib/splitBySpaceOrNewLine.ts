export const splitBySpaceOrNewLine = {
    [Symbol.split](str: string) {
        let pos = 0
        const result = []
        while (pos < str.length) {
            if (str[pos] === ' ') {
                result.push(' ')
                pos += 1
            } else if (str[pos] === '\n') {
                result.push('\n')
                pos += 1
            } else if (str[pos] === '[') {
                const indexOfEndOfVerseNumber = str.indexOf(']', pos)

                if (indexOfEndOfVerseNumber === -1) {
                    result.push(str.substring(pos))
                    pos = str.length
                } else {
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
                    result.push(str.substring(pos, endOfWord))
                    pos = endOfWord
                }
            }
        }
        return result
    },
}
