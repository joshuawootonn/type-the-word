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
                {typedWord?.letters.slice(word.letters.length).length
                    ? typedWord.letters.map((letter, lIndex) => {
                          const correctLetter = word.letters?.at(lIndex)
                          const isEqual = isLetterEqual(correctLetter, letter)

                          return (
                              <span
                                  data-letter
                                  key={lIndex}
                                  className={clsx(
                                      'letter relative z-0',
                                      isEqual && 'correct text-emerald-500',
                                      correctLetter &&
                                          !isEqual &&
                                          'incorrect text-rose-700',
                                      lIndex > word.letters.length - 1 &&
                                          'extra text-rose-700',
                                  )}
                              >
                                  {letter === '\n' ? (
                                      <NewLineIndicator isActive={active} />
                                  ) : letter === ' ' ? (
                                      <>&nbsp;</>
                                  ) : (
                                      letter
                                  )}
                              </span>
                          )
                      })
                    : word.letters.map((letter, lIndex) => {
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
                                  {letter === '\n' ? (
                                      <NewLineIndicator isActive={active} />
                                  ) : letter === ' ' ? (
                                      <>&nbsp;</>
                                  ) : (
                                      letter
                                  )}
                              </span>
                          )
                      })}
            </span>
            <span className="text-[0px]"> </span>
        </>
    )
}
