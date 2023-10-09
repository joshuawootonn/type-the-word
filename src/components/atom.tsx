import clsx from 'clsx'

import { isAtomEqual, isLetterEqual } from '~/lib/isEqual'
import { Atom } from '~/lib/parseEsv'

export function AtomComponent<T extends Atom>({
    atom,
    typedAtom,
    isAtomTyped,
}: {
    typedAtom?: T
    atom: T
    isAtomTyped: boolean
}) {
    if (atom.type === 'newLine') return <br />

    if (atom.type === 'space')
        return <span className="space inline-block w-3"> </span>

    if (
        atom.type === 'word' &&
        (typedAtom == null || typedAtom.type === 'word')
    ) {
        return (
            <span
                className={clsx(
                    'word',
                    typedAtom && isAtomTyped == null && 'active',
                    typedAtom &&
                        isAtomTyped &&
                        !isAtomEqual(atom, typedAtom) &&
                        'underline decoration-rose-500',
                )}
            >
                {typedAtom &&
                typedAtom.letters.slice(atom.letters.length).length
                    ? typedAtom.letters.map((letter, lIndex) => {
                          const correctLetter = atom.letters?.at(lIndex)
                          const isEqual = isLetterEqual(correctLetter, letter)

                          return (
                              <span
                                  data-letter
                                  key={lIndex}
                                  className={clsx(
                                      'letter',
                                      isEqual && 'correct text-emerald-500',
                                      correctLetter &&
                                          !isEqual &&
                                          'incorrect text-rose-700',
                                      lIndex > atom.letters.length - 1 &&
                                          'extra text-rose-700',
                                  )}
                              >
                                  {letter}
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
                                      'letter',
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
            </span>
        )
    }
}
