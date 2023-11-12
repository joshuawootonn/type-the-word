import clsx from 'clsx'
import { isAtomTyped } from '~/lib/isEqual'
import { Word } from './word'
import { Inline, Paragraph, Verse } from '~/lib/parseEsv'
import { isAtomComplete } from '~/lib/keystroke'
import { useContext, useRef, useState } from 'react'
import { ArenaContext } from '~/components/arena'

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
        <p className={clsx('text-lg')}>
            {node.nodes.map((verse, vIndex) => {
                const isCurrentVerse = verse.verse.value === currentVerse
                const versePosition = verse.metadata.hangingVerse
                    ? position.slice(
                          verse.metadata.offset,
                          verse.metadata.offset + verse.metadata.length,
                      )
                    : position

                return (
                    <Verse
                        key={vIndex}
                        verse={verse}
                        versePosition={versePosition}
                        isCurrentVerse={isCurrentVerse}
                        setCurrentVerse={setCurrentVerse}
                        isIndented={node.metadata.blockIndent}
                    />
                )
            })}
        </p>
    )
}

export function Verse({
    verse,
    isCurrentVerse,
    setCurrentVerse,
    versePosition,
    isIndented,
}: {
    versePosition: Inline[]
    setCurrentVerse: (verse: string) => void
    isCurrentVerse: boolean
    isIndented: boolean
    verse: Verse
}) {
    const { rect: arenaRect } = useContext(ArenaContext)
    const [rect, setRect] = useState<DOMRect | null>(null)
    console.log(rect, arenaRect)
    return !isCurrentVerse ? (
        <span
            role="button"
            tabIndex={0}
            className={clsx(
                // 'break-spaces text-balance relative inline w-full whitespace-normal text-left',
                'break-spaces text-balance inline text-left',
            )}
            ref={el => {
                if (el && rect == null)
                    setRect(el.getBoundingClientRect() ?? null)
            }}
            onClick={() => {
                setCurrentVerse(verse.verse.value)
            }}
        >
            {verse.nodes.map((atom, aIndexPrime) => {
                if (atom.type === 'newLine') return <br key={aIndexPrime} />
                if (atom.type === 'verseNumber') {
                    return (
                        <b
                            className={clsx(isIndented && 'absolute -left-0')}
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
            })}
        </span>
    ) : (
        <span
            className={clsx(
                'active-verse verse break-spaces text-balance group inline hover:cursor-pointer',
            )}
            ref={el => {
                if (el && rect == null)
                    setRect(el.getBoundingClientRect() ?? null)
            }}
            onClick={() => {
                setCurrentVerse(verse.verse.value)
            }}
        >
            {verse.nodes.map((atom, aIndexPrime) => {
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
                            className={clsx(isIndented && 'absolute -left-0')}
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
                    (typedAtom == null || typedAtom.type === 'word')
                ) {
                    return (
                        <Word
                            key={aIndexPrime}
                            word={atom}
                            active={Boolean(
                                (aIndex === 0 || isAtomComplete(lastAtom)) &&
                                    !isAtomComplete(typedAtom) &&
                                    nextAtom == null,
                            )}
                            typedWord={typedAtom}
                            isPrevTyped={
                                (versePosition.length === 0 && aIndex === 0) ||
                                !!lastAtom
                            }
                            isWordTyped={isAtomComplete(typedAtom)}
                        />
                    )
                }

                return null
            })}
        </span>
    )
}
