import clsx from 'clsx'
import { isAtomTyped } from '~/lib/isEqual'
import { Word } from './atom'
import { Atom, Paragraph } from '~/lib/parseEsv'

export function Paragraph({
    position,
    node,
    currentVerse,
    setCurrentVerse,
}: {
    position: Atom[]
    node: Paragraph
    currentVerse?: string
    setCurrentVerse: (verse: string) => void
}) {
    return (
        <p className="font-[0px]">
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse === currentVerse
                return (
                    <span
                        key={vIndex}
                        className={clsx(
                            'verse break-spaces text-balance inline h-3',
                            isCurrentVerse && 'active-verse',
                        )}
                        onClick={() => {
                            setCurrentVerse(verse.verse)
                        }}
                    >
                        {!isCurrentVerse
                            ? verse.nodes.map((atom, aIndexPrime) => {
                                  if (atom.type === 'newLine') return <br />

                                  if (atom.type === 'verseNumber') {
                                      return (
                                          <b key={aIndexPrime}>{atom.number}</b>
                                      )
                                  }

                                  if (atom.type === 'space') {
                                      return (
                                          <span
                                              key={aIndexPrime}
                                              className={clsx(
                                                  'space inline-flex h-[19px] w-2.5',
                                              )}
                                          >
                                              {' '}
                                          </span>
                                      )
                                  }
                                  if (atom.type === 'word') {
                                      return (
                                          <Word
                                              key={aIndexPrime}
                                              atom={atom}
                                              active={false}
                                              isPrevTyped={false}
                                              isAtomTyped={false}
                                          />
                                      )
                                  }

                                  return null
                              })
                            : verse.nodes.map((atom, aIndexPrime) => {
                                  const aIndex = verse.nodes
                                      .slice(0, aIndexPrime)
                                      .filter(isAtomTyped).length

                                  const lastAtom = position.at(aIndex - 1)
                                  const typedAtom = position.at(aIndex)

                                  const nextAtom = position.at(aIndex + 1)
                                  if (atom.type === 'newLine')
                                      return (
                                          <>
                                              <span
                                                  className={clsx(
                                                      'inline-flex h-[19px]  items-center justify-center px-2 opacity-0 transition-opacity',
                                                      lastAtom != null &&
                                                          typedAtom == null &&
                                                          'active-space opacity-100',
                                                  )}
                                              >
                                                  <svg
                                                      className="translate-y-0.5"
                                                      width="16"
                                                      height="16"
                                                      viewBox="0 0 16 16"
                                                      fill="none"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                  >
                                                      <path
                                                          d="M12.5611 4.33774C12.5611 4.33774 12.5611 4.84212 12.5611 5.82744C12.5611 7.72453 11.5283 8.55823 9.83026 8.55823C6.99146 8.55823 2.56105 8.55823 2.56105 8.55823M2.56105 8.55823C2.56105 8.39635 4.96506 5.82744 4.96506 5.82744M2.56105 8.55823C2.56105 8.72012 4.12224 10.3498 4.96506 11.2455"
                                                          stroke="black"
                                                          stroke-width="2"
                                                          stroke-linecap="round"
                                                          stroke-linejoin="round"
                                                      />
                                                  </svg>
                                              </span>
                                              <br />
                                          </>
                                      )

                                  if (atom.type === 'verseNumber') {
                                      return (
                                          <b key={aIndexPrime}>{atom.number}</b>
                                      )
                                  }
                                  if (atom.type === 'space') {
                                      return (
                                          <span
                                              key={aIndexPrime}
                                              className={clsx(
                                                  'space inline-flex h-[19px] w-2.5',
                                                  lastAtom != null &&
                                                      typedAtom == null &&
                                                      'active-space',
                                              )}
                                          >
                                              {' '}
                                          </span>
                                      )
                                  }
                                  if (
                                      atom.type === 'word' &&
                                      (typedAtom == null ||
                                          typedAtom.type === 'word')
                                  ) {
                                      //   if (
                                      //       atom.letters
                                      //           .length ===
                                      //           3 &&
                                      //       atom
                                      //           .letters[0] ===
                                      //           'N'
                                      //   )
                                      //       console.log(
                                      //           'word',
                                      //           {
                                      //               atom,
                                      //               typedAtom,
                                      //               nextAtom,
                                      //               position,
                                      //               aIndex,
                                      //               aIndexPrime,
                                      //               active:
                                      //                   (aIndex ===
                                      //                       0 ||
                                      //                       lastAtom !=
                                      //                           null) &&
                                      //                   nextAtom ==
                                      //                       null,
                                      //               1:
                                      //                   aIndexPrime ===
                                      //                   0,
                                      //               2:
                                      //                   lastAtom !=
                                      //                   null,
                                      //               3:
                                      //                   nextAtom ==
                                      //                   null,
                                      //           },
                                      //       )
                                      return (
                                          <Word
                                              key={aIndexPrime}
                                              atom={atom}
                                              active={
                                                  (aIndex === 0 ||
                                                      lastAtom != null) &&
                                                  nextAtom == null
                                              }
                                              typedAtom={typedAtom}
                                              isPrevTyped={
                                                  (position.length === 0 &&
                                                      aIndex === 0) ||
                                                  !!lastAtom
                                              }
                                              isAtomTyped={!!nextAtom}
                                          />
                                      )
                                  }

                                  return null
                              })}
                    </span>
                )
            })}
        </p>
    )
}
