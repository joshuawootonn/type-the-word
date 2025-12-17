import clsx from 'clsx'

import { NewLineIndicator } from '~/components/newLineIndicator'
import { isAtomEqual, isLetterEqual } from '~/lib/isEqual'
import { type Word } from '~/lib/parseEsv'

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

    const isErrored = typedWord && isWordTyped && !isAtomEqual(word, typedWord)

    return (
        <>
            <span className={clsx('word', active && 'active-word')}>
                {wordWithoutEnder.map((letter, lIndex) => {
                    const typedLetter = typedWord?.letters.at(lIndex)
                    const isEqual = isLetterEqual(letter, typedLetter)
                    return (
                        <span
                            key={lIndex}
                            className={clsx(
                                'letter',
                                isEqual && 'correct',
                                typedLetter && !isEqual && 'incorrect',
                                isErrored &&
                                    'error underline decoration-error decoration-2',
                            )}
                        >
                            {letter}
                        </span>
                    )
                })}
                {extras?.map((letter, lIndex) => {
                    return (
                        <span
                            key={lIndex}
                            className={clsx(
                                'letter extra',
                                isErrored &&
                                    'error underline decoration-error decoration-2',
                            )}
                        >
                            {letter}
                        </span>
                    )
                })}

                <span className={clsx('letter relative z-0')}>
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
