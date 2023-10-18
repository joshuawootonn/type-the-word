import clsx from 'clsx'

import { isAtomEqual, isLetterEqual } from '~/lib/isEqual'
import { Word } from '~/lib/parseEsv'
import { NewLineIndicator } from '~/components/newLineIndicator'

export function Word({
    word,
    typedWord,
    isWordTyped,
    active,
}: {
    typedWord?: Word
    word: Word
    isPrevTyped: boolean
    isWordTyped: boolean
    active: boolean
}) {
    const wordWithoutEnder = word.letters.slice(0, -1)
    const ender = word.letters.at(-1)

    const extras = typedWord?.letters
        .slice(wordWithoutEnder.length)
        .filter(l => !isLetterEqual(l, ender))

    return (
        <>
            <span
                className={clsx(
                    'word',
                    active && 'active-word',
                    typedWord &&
                        isWordTyped &&
                        !isAtomEqual(word, typedWord) &&
                        'error underline decoration-rose-500',
                )}
            >
                {wordWithoutEnder.map((letter, lIndex) => {
                    const typedLetter = typedWord?.letters.at(lIndex)
                    const isEqual = isLetterEqual(letter, typedLetter)
                    return (
                        <span
                            data-letter
                            key={lIndex}
                            className={clsx(
                                'letter relative z-0',
                                isEqual && 'correct text-emerald-500',
                                typedLetter &&
                                    !isEqual &&
                                    'incorrect text-rose-700',
                            )}
                        >
                            {letter}
                        </span>
                    )
                })}
                {extras?.map((letter, lIndex) => {
                    return (
                        <span
                            data-letter
                            key={lIndex}
                            className={clsx(
                                'letter extra relative z-0 text-rose-700',
                            )}
                        >
                            {letter}
                        </span>
                    )
                })}

                <span data-letter className={clsx('letter relative z-0')}>
                    {ender === '\n' ? (
                        <NewLineIndicator isActive={active} />
                    ) : ender === ' ' ? (
                        <>&nbsp;</>
                    ) : (
                        ender
                    )}
                </span>
            </span>
            <span className="text-[0px]"> </span>
        </>
    )
}
