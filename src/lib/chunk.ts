//https://gist.github.com/andreigec/677b1b7ddc66c380bdc8c3343a5e26c8
export function chunk<T>(array: T[], size: number): T[][] {
    const chunkedArr = []
    const copied = [...array] // ES6 destructuring
    const numOfChild = Math.ceil(copied.length / size) // Round up to the nearest integer
    for (let i = 0; i < numOfChild; i++) {
        chunkedArr.push(copied.splice(0, size))
    }
    return chunkedArr
}
