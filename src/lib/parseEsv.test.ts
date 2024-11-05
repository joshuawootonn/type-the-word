import { describe, expect, test } from 'vitest'

import {
    Paragraph,
    parseChapter,
    parseNextChapter,
    parsePrevChapter,
} from './parseEsv'

export function sum(a: number, b: number): number {
    return a + b
}
test('parse james 1:1', () => {
    const verseHtml = `<h2 class="extra_text">James 1:1–4 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/59001001-59001004.mp3" title="James 1:1–4" type="audio/mpeg">Listen</a>)</small></h2>
<h3 id="p59001001_01-1">Greeting</h3>
<p id="p59001001_02-1" class="starts-chapter"><b class="chapter-num" id="v59001001-1">1:1&nbsp;</b>James, a servant<sup class="footnote"><a class="fn" href="#f1-1" id="fb1-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;bondservant&quot;&gt;For the contextual rendering of the Greek word &lt;i language=&quot;Greek&quot;&gt;doulos&lt;/i&gt;, see &lt;a href=&quot;https://www.esv.org/preface/&quot;&gt;Preface&lt;/a&gt;&lt;/note&gt;">1</a></sup> of God and of the Lord Jesus Christ,</p>
<p id="p59001001_02-1">To the twelve tribes in the Dispersion:</p>
<p id="p59001001_02-1">Greetings.</p>
<h3 id="p59001001_02-1">Testing of Your Faith</h3>
<p id="p59001001_06-1"><b class="verse-num" id="v59001002-1">2&nbsp;</b>Count it all joy, my brothers,<sup class="footnote"><a class="fn" href="#f2-1" id="fb2-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;gender-neutral&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;brothers&lt;/span&gt; and sisters&lt;/i&gt;. In New Testament usage, depending on the context, the plural Greek word &lt;i language=&quot;Greek&quot;&gt;adelphoi&lt;/i&gt; (translated “brothers”) may refer either to &lt;i&gt;brothers&lt;/i&gt; or to &lt;i&gt;brothers and sisters&lt;/i&gt;; also verses 16, 19&lt;/note&gt;">2</a></sup> when you meet trials of various kinds, <b class="verse-num" id="v59001003-1">3&nbsp;</b>for you know that the testing of your faith produces steadfastness. <b class="verse-num" id="v59001004-1">4&nbsp;</b>And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.</p>
<div class="footnotes extra_text">
<h3>Footnotes</h3>
<p><span class="footnote"><a href="#fb1-1" id="f1-1">[1]</a></span> <span class="footnote-ref">1:1</span> <note class="translation" sub-class="bondservant">For the contextual rendering of the Greek word <i language="Greek">doulos</i>, see <a href="https://www.esv.org/preface/">Preface</a></note>
<br />
<span class="footnote"><a href="#fb2-1" id="f2-1">[2]</a></span> <span class="footnote-ref">1:2</span> <note class="translation" sub-class="gender-neutral">Or <i><span class="catch-word">brothers</span> and sisters</i>. In New Testament usage, depending on the context, the plural Greek word <i language="Greek">adelphoi</i> (translated “brothers”) may refer either to <i>brothers</i> or to <i>brothers and sisters</i>; also verses 16, 19</note>
</p>
</div>
<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`

    const result = parseChapter(verseHtml)
    const firstParagraph = result.nodes.at(2) as Paragraph
    const firstVerseA = firstParagraph.nodes.at(0)!
    const secondParagraph = result.nodes.at(3) as Paragraph
    const firstVerseB = secondParagraph.nodes.at(0)!
    const thirdParagraph = result.nodes.at(4) as Paragraph
    const firstVerseC = thirdParagraph.nodes.at(0)!

    expect(firstVerseA.nodes.length).toBe(12)
    expect(firstVerseA.metadata.hangingVerse).toBeFalsy()
    expect(firstVerseB.nodes.length).toBe(7)
    expect(firstVerseB.metadata.hangingVerse).toBeTruthy()
    expect(firstVerseC.nodes.length).toBe(1)
    expect(firstVerseC.metadata.offset).toBe(12 + 7 - 1)
    expect(firstVerseC.metadata.hangingVerse).toBeTruthy()
})

test.skip('parse psalm 23', () => {
    const verseHtml = `"<h2 class="extra_text">Psalm 23 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/19023001-19023006.mp3" title="Psalm 23" type="audio/mpeg">Listen</a>)</small></h2>
<h3 id="p19023001_01-1">The <span class="divine-name">Lord</span> Is My Shepherd</h3>
<h4 id="p19023001_06-1" class="psalm-title">A Psalm of David.</h4>
<p><span class="footnote"><a href="#fb1-1" id="f1-1">[1]</a></span> <span class="footnote-ref">23:2</span> <note class="translation" sub-class="original">Hebrew <i><span class="catch-word">beside</span> waters of rest</i></note>
<br />
<span class="footnote"><a href="#fb2-1" id="f2-1">[2]</a></span> <span class="footnote-ref">23:3</span> <note class="alternative">Or <i><span class="catch-word">in</span> right paths</i></note>
<br />
<span class="footnote"><a href="#fb3-1" id="f3-1">[3]</a></span> <span class="footnote-ref">23:4</span> <note class="alternative">Or <i><span class="catch-word">the valley of</span> deep darkness</i></note>
<br />
<span class="footnote"><a href="#fb4-1" id="f4-1">[4]</a></span> <span class="footnote-ref">23:6</span> <note class="alternative">Or <i>Only</i></note>
<br />
<span class="footnote"><a href="#fb5-1" id="f5-1">[5]</a></span> <span class="footnote-ref">23:6</span> <note class="alternative">Or <i>steadfast love</i></note>
<br />
<span class="footnote"><a href="#fb6-1" id="f6-1">[6]</a></span> <span class="footnote-ref">23:6</span> <note class="alternative">Or <i><span class="catch-word">shall</span> return to dwell</i></note>
<br />
<span class="footnote"><a href="#fb7-1" id="f7-1">[7]</a></span> <span class="footnote-ref">23:6</span> <note class="translation" sub-class="original">Hebrew <i>for length of days</i></note>
</p>
</div>
<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>"`

    const result = parseChapter(verseHtml)
    const firstParagraph = result.nodes.at(3) as Paragraph
    const firstVerse = firstParagraph.nodes.at(0)!
    const secondVerse = firstParagraph.nodes.at(1)!

    expect(firstVerse.nodes.length).toBe(13)
    expect(secondVerse.nodes.length).toBe(23)
})

const verseHtml = `<h2 class="extra_text">1 Peter 1 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/60001001-60001025.mp3" title="1 Peter 1" type="audio/mpeg">Listen</a>)</small></h2>
<h3 id="p60001001_01-1">Greeting</h3>
<p id="p60001001_02-1" class="starts-chapter"><b class="chapter-num" id="v60001001-1">1:1&nbsp;</b>Peter, an apostle of Jesus Christ,</p>
<p id="p60001001_02-1">To those who are elect exiles of the Dispersion in Pontus, Galatia, Cappadocia, Asia, and Bithynia, <b class="verse-num" id="v60001002-1">2&nbsp;</b>according to the foreknowledge of God the Father, in the sanctification of the Spirit, for obedience to Jesus Christ and for sprinkling with his blood:</p>
<p id="p60001002_02-1">May grace and peace be multiplied to you.</p>
<h3 id="p60001002_02-1">Born Again to a Living Hope</h3>
<p id="p60001002_08-1"><b class="verse-num" id="v60001003-1">3&nbsp;</b>Blessed be the God and Father of our Lord Jesus Christ! According to his great mercy, he has caused us to be born again to a living hope through the resurrection of Jesus Christ from the dead, <b class="verse-num" id="v60001004-1">4&nbsp;</b>to an inheritance that is imperishable, undefiled, and unfading, kept in heaven for you, <b class="verse-num" id="v60001005-1">5&nbsp;</b>who by God’s power are being guarded through faith for a salvation ready to be revealed in the last time. <b class="verse-num" id="v60001006-1">6&nbsp;</b>In this you rejoice, though now for a little while, if necessary, you have been grieved by various trials, <b class="verse-num" id="v60001007-1">7&nbsp;</b>so that the tested genuineness of your faith—more precious than gold that perishes though it is tested by fire—may be found to result in praise and glory and honor at the revelation of Jesus Christ. <b class="verse-num" id="v60001008-1">8&nbsp;</b>Though you have not seen him, you love him. Though you do not now see him, you believe in him and rejoice with joy that is inexpressible and filled with glory, <b class="verse-num" id="v60001009-1">9&nbsp;</b>obtaining the outcome of your faith, the salvation of your souls.</p>
<p id="p60001009_08-1"><b class="verse-num" id="v60001010-1">10&nbsp;</b>Concerning this salvation, the prophets who prophesied about the grace that was to be yours searched and inquired carefully, <b class="verse-num" id="v60001011-1">11&nbsp;</b>inquiring what person or time<sup class="footnote"><a class="fn" href="#f1-1" id="fb1-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;what time or circumstances&lt;/i&gt;&lt;/note&gt;">1</a></sup> the Spirit of Christ in them was indicating when he predicted the sufferings of Christ and the subsequent glories. <b class="verse-num" id="v60001012-1">12&nbsp;</b>It was revealed to them that they were serving not themselves but you, in the things that have now been announced to you through those who preached the good news to you by the Holy Spirit sent from heaven, things into which angels long to look.</p>
<h3 id="p60001012_08-1">Called to Be Holy</h3>
<p id="p60001012_12-1"><b class="verse-num" id="v60001013-1">13&nbsp;</b>Therefore, preparing your minds for action,<sup class="footnote"><a class="fn" href="#f2-1" id="fb2-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Greek &lt;i&gt;girding up the loins of your mind&lt;/i&gt;&lt;/note&gt;">2</a></sup> and being sober-minded, set your hope fully on the grace that will be brought to you at the revelation of Jesus Christ. <b class="verse-num" id="v60001014-1">14&nbsp;</b>As obedient children, do not be conformed to the passions of your former ignorance, <b class="verse-num" id="v60001015-1">15&nbsp;</b>but as he who called you is holy, you also be holy in all your conduct, <b class="verse-num" id="v60001016-1">16&nbsp;</b>since it is written, “You shall be holy, for I am holy.” <b class="verse-num" id="v60001017-1">17&nbsp;</b>And if you call on him as Father who judges impartially according to each one’s deeds, conduct yourselves with fear throughout the time of your exile, <b class="verse-num" id="v60001018-1">18&nbsp;</b>knowing that you were ransomed from the futile ways inherited from your forefathers, not with perishable things such as silver or gold, <b class="verse-num" id="v60001019-1">19&nbsp;</b>but with the precious blood of Christ, like that of a lamb without blemish or spot. <b class="verse-num" id="v60001020-1">20&nbsp;</b>He was foreknown before the foundation of the world but was made manifest in the last times for the sake of you <b class="verse-num" id="v60001021-1">21&nbsp;</b>who through him are believers in God, who raised him from the dead and gave him glory, so that your faith and hope are in God.</p>
<p id="p60001021_12-1"><b class="verse-num" id="v60001022-1">22&nbsp;</b>Having purified your souls by your obedience to the truth for a sincere brotherly love, love one another earnestly from a pure heart, <b class="verse-num" id="v60001023-1">23&nbsp;</b>since you have been born again, not of perishable seed but of imperishable, through the living and abiding word of God; <b class="verse-num" id="v60001024-1">24&nbsp;</b>for</p>
<p class="block-indent"><span class="begin-line-group"></span>
<span id="p60001024_12-1" class="line">&nbsp;&nbsp;“All flesh is like grass</span><br /><span id="p60001024_12-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and all its glory like the flower of grass.</span><br /><span id="p60001024_12-1" class="line">&nbsp;&nbsp;The grass withers,</span><br /><span id="p60001024_12-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and the flower falls,</span><br /><span id="p60001025_12-1" class="line"><b class="verse-num inline" id="v60001025-1">25&nbsp;</b>&nbsp;&nbsp;but the word of the Lord remains forever.”</span><br /><span class="end-line-group"></span>
</p><p id="p60001025_12-1" class="same-paragraph">And this word is the good news that was preached to you.</p>
<div class="footnotes extra_text">
<h3>Footnotes</h3>
<p><span class="footnote"><a href="#fb1-1" id="f1-1">[1]</a></span> <span class="footnote-ref">1:11</span> <note class="alternative">Or <i>what time or circumstances</i></note>
<br />
<span class="footnote"><a href="#fb2-1" id="f2-1">[2]</a></span> <span class="footnote-ref">1:13</span> <note class="translation" sub-class="original">Greek <i>girding up the loins of your mind</i></note>
</p>
</div>
<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`

test('parse 1 peter 1', () => {
    const result = parseChapter(verseHtml)
    const firstParagraph = result.nodes.at(2) as Paragraph
    const secondParagraph = result.nodes.at(3) as Paragraph
    const thirdParagraph = result.nodes.at(4) as Paragraph
    const firstVerseA = firstParagraph.nodes.at(0)!
    const firstVerseB = secondParagraph.nodes.at(0)!
    const secondVerseA = secondParagraph.nodes.at(1)!
    const secondVerseB = thirdParagraph.nodes.at(0)!
    expect(firstVerseA.nodes.length).toBe(7)
    expect(firstVerseA.metadata.hangingVerse).toBeFalsy()
    expect(firstVerseB.nodes.length).toBe(16)
    expect(firstVerseB.metadata.hangingVerse).toBeTruthy()
    expect(firstVerseB.metadata.offset).toBe(6)

    expect(secondVerseA.nodes.length).toBe(26)
    expect(secondVerseA.metadata.hangingVerse).toBeFalsy()
    expect(secondVerseB.nodes.length).toBe(8)
    expect(secondVerseB.metadata.hangingVerse).toBeTruthy()
    expect(secondVerseB.metadata.offset).toBe(25)
})

describe('parsePrevChapter', () => {
    test('1 peter 1', () => {
        const prevChapter = parsePrevChapter('1_peter', 1)
        expect(prevChapter).toEqual({ url: `james_5`, label: 'James 5' })
    })

    test('1 peter 5', () => {
        const prevChapter = parsePrevChapter('1_peter', 5)
        expect(prevChapter).toEqual({ url: `1_peter_4`, label: '1 Peter 4' })
    })

    test('revelation 22', () => {
        const prevChapter = parsePrevChapter('revelation', 22)
        expect(prevChapter).toEqual({
            url: `revelation_21`,
            label: 'Revelation 21',
        })
    })

    test('genesis 1', () => {
        const prevChapter = parsePrevChapter('genesis', 1)
        expect(prevChapter).toBeNull()
    })

    test('titus', () => {
        const prevChapter = parsePrevChapter('titus', 1)
        expect(prevChapter).toEqual({
            url: `2_timothy_4`,
            label: '2 Timothy 4',
        })
    })
})

describe('parseNextChapter', () => {
    test('1 peter 1', () => {
        const nextChapter = parseNextChapter('1_peter', 1)
        expect(nextChapter).toEqual({ url: `1_peter_2`, label: '1 Peter 2' })
    })

    test('1 peter 5', () => {
        const nextChapter = parseNextChapter('1_peter', 5)
        expect(nextChapter).toEqual({ url: `2_peter_1`, label: '2 Peter 1' })
    })

    test('revelation 22', () => {
        const nextChapter = parseNextChapter('revelation', 22)
        expect(nextChapter).toBeNull()
    })

    test('genesis 1', () => {
        const nextChapter = parseNextChapter('genesis', 1)
        expect(nextChapter).toEqual({ url: `genesis_2`, label: 'Genesis 2' })
    })

    test('1 timothy 6', () => {
        const nextChapter = parseNextChapter('1_timothy', 6)
        expect(nextChapter).toEqual({
            url: `2_timothy_1`,
            label: '2 Timothy 1',
        })
    })
    test('1 thessalonians 4', () => {
        const nextChapter = parseNextChapter('1_thessalonians', 4)
        expect(nextChapter).toEqual({
            url: `1_thessalonians_5`,
            label: '1 Thessalonians 5',
        })
    })
})
