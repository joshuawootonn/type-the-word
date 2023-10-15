import clsx from 'clsx'
import { isAtomTyped } from '~/lib/isEqual'
import { Word } from './atom'
import { Atom, Paragraph } from '~/lib/parseEsv'
import { Fragment } from 'react'

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
                                  if (atom.type === 'newLine')
                                      return <br key={aIndexPrime} />

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
                                                  'space inline-flex h-[19px] w-[1ch] translate-y-[3px]',
                                              )}
                                          >
                                              &nbsp;
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
                                          <Fragment key={aIndexPrime}>
                                              <span
                                                  className={clsx(
                                                      lastAtom != null &&
                                                          typedAtom == null &&
                                                          'opacity-100',
                                                      'relative z-0 h-[19px] opacity-0 transition-opacity',
                                                  )}
                                              >
                                                  <span
                                                      className={clsx(
                                                          'absolute left-0 top-0 inline-flex h-full items-center justify-center px-2',
                                                          lastAtom != null &&
                                                              typedAtom ==
                                                                  null &&
                                                              'active-space',
                                                      )}
                                                  >
                                                      <svg
                                                          className="translate-y-[.5px]"
                                                          width="16"
                                                          height="16"
                                                          viewBox="0 0 16 16"
                                                          fill="none"
                                                          xmlns="http://www.w3.org/2000/svg"
                                                      >
                                                          <path
                                                              d="M12.5611 4.33774C12.5611 4.33774 12.5611 4.84212 12.5611 5.82744C12.5611 7.72453 11.5283 8.55823 9.83026 8.55823C6.99146 8.55823 2.56105 8.55823 2.56105 8.55823M2.56105 8.55823C2.56105 8.39635 4.96506 5.82744 4.96506 5.82744M2.56105 8.55823C2.56105 8.72012 4.12224 10.3498 4.96506 11.2455"
                                                              stroke="black"
                                                              strokeWidth="2"
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                          />
                                                      </svg>
                                                  </span>
                                              </span>
                                              <br />
                                          </Fragment>
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
                                                  'space inline-flex h-[19px] w-[1ch] translate-y-[3px]',
                                                  lastAtom != null &&
                                                      typedAtom == null &&
                                                      'active-space',
                                              )}
                                          >
                                              &nbsp;
                                          </span>
                                      )
                                  }
                                  if (
                                      atom.type === 'word' &&
                                      (typedAtom == null ||
                                          typedAtom.type === 'word')
                                  ) {
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
