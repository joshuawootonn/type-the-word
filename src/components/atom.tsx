import clsx from 'clsx'

import { isAtomEqual, isLetterEqual } from '~/lib/isEqual'
import { Word } from '~/lib/parseEsv'
import { NewLineIndicator } from '~/components/newLineIndicator'

export function Word({
    atom,
    typedAtom,
    isAtomTyped,
    active,
}: {
    typedAtom?: Word
    atom: Word
    isPrevTyped: boolean
    isAtomTyped: boolean
    active: boolean
}) {
    return (
        <>
            <span
                className={clsx(
                    'word',
                    active && 'active-word',
                    typedAtom &&
                        isAtomTyped &&
                        !isAtomEqual(atom, typedAtom) &&
                        'error underline decoration-rose-500',
                )}
            >
                {typedAtom?.letters.slice(atom.letters.length).length
                    ? typedAtom.letters.map((letter, lIndex) => {
                          const correctLetter = atom.letters?.at(lIndex)
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
                                      lIndex > atom.letters.length - 1 &&
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
                    : atom.letters.map((letter, lIndex) => {
                          const typedLetter = typedAtom?.letters.at(lIndex)
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
