/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').options} */
const config = {
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    semi: false,
    singleQuote: true,
    quoteProps: 'as-needed',
    jsxSingleQuote: false,
    trailingComma: 'all',
    bracketSpacing: true,
    jsxBracketSameLine: false,
    arrowParens: 'avoid',
    requirePragma: false,
    insertPragma: false,
    proseWrap: 'preserve',
    htmlWhitespaceSensitivity: 'css',
    endOfLine: 'lf',
    importOrder: ['<THIRD_PARTY_MODULES>', '^[~]', '^[./,../]'],
    importOrderSeparation: true,
    importOrderCaseInsensitive: true,
    plugins: [
        'prettier-plugin-tailwindcss',
        // this is broken right now. find another solution or update when there is something available.
        // '@trivago/prettier-plugin-sort-imports',
    ],
}

export default config
