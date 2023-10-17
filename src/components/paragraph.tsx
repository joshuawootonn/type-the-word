import clsx from 'clsx'
import { isAtomTyped } from '~/lib/isEqual'
import { Word } from './atom'
import { Atom, Paragraph } from '~/lib/parseEsv'
import { isAtomComplete } from '~/lib/keystroke'
import { NewLineIndicator } from '~/components/newLineIndicator'

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
                                  if (atom.type === 'newLine') {
                                      const isActive =
                                          lastAtom != null && typedAtom == null
                                      return (
                                          <NewLineIndicator
                                              key={aIndexPrime}
                                              isActive={isActive}
                                          />
                                      )
                                  }

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
                                              isAtomTyped={isAtomComplete(
                                                  typedAtom,
                                              )}
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
