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
    bracketSameLine: false,
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
        '@trivago/prettier-plugin-sort-imports',
        'prettier-plugin-tailwindcss', // must be last
    ],
}

export default config
