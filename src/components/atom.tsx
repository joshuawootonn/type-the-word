import clsx from 'clsx'

import { isAtomEqual, isLetterEqual } from '~/lib/isEqual'
import { Word } from '~/lib/parseEsv'

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
        <span
            className={clsx(
                'word',
                'peer mr-[1ch]',
                active && 'active-word',
                typedAtom &&
                    isAtomTyped &&
                    !isAtomEqual(atom, typedAtom) &&
                    'underline decoration-rose-500',
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
