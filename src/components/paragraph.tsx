import clsx from 'clsx'
import { isAtomTyped } from '~/lib/isEqual'
import { Word } from './word'
import { Inline, Paragraph } from '~/lib/parseEsv'
import { isAtomComplete } from '~/lib/keystroke'

export function Paragraph({
    position,
    node,
    currentVerse,
    setCurrentVerse,
}: {
    position: Inline[]
    node: Paragraph
    currentVerse?: string
    setCurrentVerse: (verse: string) => void
}) {
    return (
        <p
            className={clsx(
                'relative font-[0px]',
                node.metadata.blockIndent && 'ml-3',
            )}
        >
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse
                const versePosition = verse.verseMetadata.hangingVerse
                    ? position.slice(
                          verse.verseMetadata.offset,
                          verse.verseMetadata.offset +
                              verse.verseMetadata.length,
                      )
                    : position
                return (
                    <span
                        key={vIndex}
                        className={clsx(
                            'verse break-spaces text-balance inline h-3',
                            isCurrentVerse && 'active-verse',
                        )}
                        onClick={() => {
                            setCurrentVerse(verse.verse.value)
                        }}
                    >
                        {!isCurrentVerse
                            ? verse.nodes.map((atom, aIndexPrime) => {
                                  if (atom.type === 'newLine')
                                      return <br key={aIndexPrime} />

                                  if (atom.type === 'verseNumber') {
                                      return (
                                          <b
                                              className={clsx(
                                                  node.metadata.blockIndent &&
                                                      'absolute -left-3',
                                              )}
                                              key={aIndexPrime}
                                          >
                                              {atom.text.split(':').at(-1)}
                                          </b>
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
                                              word={atom}
                                              active={false}
                                              isPrevTyped={false}
                                              isWordTyped={false}
                                          />
                                      )
                                  }

                                  return null
                              })
                            : verse.nodes.map((atom, aIndexPrime) => {
                                  const aIndex = verse.nodes
                                      .slice(0, aIndexPrime)
                                      .filter(isAtomTyped).length

                                  const lastAtom = versePosition.at(aIndex - 1)
                                  const typedAtom = versePosition.at(aIndex)
                                  const nextAtom = versePosition.at(aIndex + 1)

                                  if (atom.type === 'newLine') {
                                      return <br key={aIndexPrime} />
                                  }

                                  if (atom.type === 'verseNumber') {
                                      return (
                                          <b
                                              className={clsx(
                                                  node.metadata.blockIndent &&
                                                      'absolute -left-3',
                                              )}
                                              key={aIndexPrime}
                                          >
                                              {atom.text.split(':').at(-1)}
                                          </b>
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
                                              word={atom}
                                              active={Boolean(
                                                  (aIndex === 0 ||
                                                      isAtomComplete(
                                                          lastAtom,
                                                      )) &&
                                                      !isAtomComplete(
                                                          typedAtom,
                                                      ) &&
                                                      nextAtom == null,
                                              )}
                                              typedWord={typedAtom}
                                              isPrevTyped={
                                                  (versePosition.length === 0 &&
                                                      aIndex === 0) ||
                                                  !!lastAtom
                                              }
                                              isWordTyped={isAtomComplete(
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
