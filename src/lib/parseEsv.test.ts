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

test('parse song of solomon 3', () => {
    const verseHtml = `<h2 class="extra_text">Song of Solomon 3 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/22003001-22003011.mp3" title="Song of Solomon 3" type="audio/mpeg">Listen</a>)</small></h2><h3 id="p22003001_01-1">The Bride’s Dream</h3><p class="block-indent"><span class="begin-line-group"></span><span id="p22003001_04-1" class="line"><b class="chapter-num" id="v22003001-1">3:1&nbsp;</b>&nbsp;&nbsp;On my bed by night</span><br /><span id="p22003001_04-1" class="line">&nbsp;&nbsp;I sought him whom my soul loves;</span><br /><span id="p22003001_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;I sought him, but found him not.</span><br /><span id="p22003002_04-1" class="line"><b class="verse-num inline" id="v22003002-1">2&nbsp;</b>&nbsp;&nbsp;I will rise now and go about the city,</span><br /><span id="p22003002_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;in the streets and in the squares;</span><br /><span id="p22003002_04-1" class="line">&nbsp;&nbsp;I will seek him whom my soul loves.</span><br /><span id="p22003002_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;I sought him, but found him not.</span><br /><span id="p22003003_04-1" class="line"><b class="verse-num inline" id="v22003003-1">3&nbsp;</b>&nbsp;&nbsp;The watchmen found me</span><br /><span id="p22003003_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;as they went about in the city.</span><br /><span id="p22003003_04-1" class="line">&nbsp;&nbsp;“Have you seen him whom my soul loves?”</span><br /><span id="p22003004_04-1" class="line"><b class="verse-num inline" id="v22003004-1">4&nbsp;</b>&nbsp;&nbsp;Scarcely had I passed them</span><br /><span id="p22003004_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;when I found him whom my soul loves.</span><br /><span id="p22003004_04-1" class="line">&nbsp;&nbsp;I held him, and would not let him go</span><br /><span id="p22003004_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;until I had brought him into my mother’s house,</span><br /><span id="p22003004_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and into the chamber of her who conceived me.</span><br /><span id="p22003005_04-1" class="line"><b class="verse-num inline" id="v22003005-1">5&nbsp;</b>&nbsp;&nbsp;I adjure you, O daughters of Jerusalem,</span><br /><span id="p22003005_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;by the gazelles or the does of the field,</span><br /><span id="p22003005_04-1" class="line">&nbsp;&nbsp;that you not stir up or awaken love</span><br /><span id="p22003005_04-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;until it pleases.</span><br /><span class="end-line-group"></span></p><h3 id="p22003005_04-1">Solomon Arrives for the Wedding</h3><p class="block-indent"><span class="begin-line-group"></span><span id="p22003006_09-1" class="line"><b class="verse-num inline" id="v22003006-1">6&nbsp;</b>&nbsp;&nbsp;What is that coming up from the wilderness</span><br /><span id="p22003006_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;like columns of smoke,</span><br /><span id="p22003006_09-1" class="line">&nbsp;&nbsp;perfumed with myrrh and frankincense,</span><br /><span id="p22003006_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;with all the fragrant powders of a merchant?</span><br /><span id="p22003007_09-1" class="line"><b class="verse-num inline" id="v22003007-1">7&nbsp;</b>&nbsp;&nbsp;Behold, it is the litter<sup class="footnote"><a class="fn" href="#f1-1" id="fb1-1" title="&lt;note class=&quot;explanation&quot;&gt;That is, &lt;span class=&quot;catch-word&quot;&gt;the&lt;/span&gt; couch on which servants carry a king&lt;/note&gt;">1</a></sup> of Solomon!</span><br /><span id="p22003007_09-1" class="line">&nbsp;&nbsp;Around it are sixty mighty men,</span><br /><span id="p22003007_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;some of the mighty men of Israel,</span><br /><span id="p22003008_09-1" class="line"><b class="verse-num inline" id="v22003008-1">8&nbsp;</b>&nbsp;&nbsp;all of them wearing swords</span><br /><span id="p22003008_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and expert in war,</span><br /><span id="p22003008_09-1" class="line">&nbsp;&nbsp;each with his sword at his thigh,</span><br /><span id="p22003008_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;against terror by night.</span><br /><span id="p22003009_09-1" class="line"><b class="verse-num inline" id="v22003009-1">9&nbsp;</b>&nbsp;&nbsp;King Solomon made himself a carriage<sup class="footnote"><a class="fn" href="#f2-1" id="fb2-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;sedan chair&lt;/i&gt;&lt;/note&gt;">2</a></sup></span><br /><span id="p22003009_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;from the wood of Lebanon.</span><br /><span id="p22003010_09-1" class="line"><b class="verse-num inline" id="v22003010-1">10&nbsp;</b>&nbsp;&nbsp;He made its posts of silver,</span><br /><span id="p22003010_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;its back of gold, its seat of purple;</span><br /><span id="p22003010_09-1" class="line">&nbsp;&nbsp;its interior was inlaid with love</span><br /><span id="p22003010_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;by the daughters of Jerusalem.</span><br /><span id="p22003011_09-1" class="line"><b class="verse-num inline" id="v22003011-1">11&nbsp;</b>&nbsp;&nbsp;Go out, O daughters of Zion,</span><br /><span id="p22003011_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and look upon King Solomon,</span><br /><span id="p22003011_09-1" class="line">&nbsp;&nbsp;with the crown with which his mother crowned him</span><br /><span id="p22003011_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;on the day of his wedding,</span><br /><span id="p22003011_09-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;on the day of the gladness of his heart.</span><br /></p><span class="end-line-group"></span><div class="footnotes extra_text"><h3>Footnotes</h3><p><span class="footnote"><a href="#fb1-1" id="f1-1">[1]</a></span> <span class="footnote-ref">3:7</span> <note class="explanation">That is, <span class="catch-word">the</span> couch on which servants carry a king</note><br /><span class="footnote"><a href="#fb2-1" id="f2-1">[2]</a></span> <span class="footnote-ref">3:9</span> <note class="alternative">Or <i>sedan chair</i></note></p></div><p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`
    const result = parseChapter(verseHtml)
})

test('parse song of solomon 4', () => {
    const verseHtml = `<h2 class="extra_text">Song of Solomon 4 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/22004001-22004016.mp3" title="Song of Solomon 4" type="audio/mpeg">Listen</a>)</small></h2>\n<h3 id="p22004001_01-1">Solomon Admires His Bride’s Beauty</h3>\n<p class="block-indent"><h4 id="p22004001_06-1" class="speaker">He</h4>\n<span class="begin-line-group"></span>\n<span id="p22004001_06-1" class="line"><b class="chapter-num" id="v22004001-1">4:1&nbsp;</b>&nbsp;&nbsp;Behold, you are beautiful, my love,</span><br /><span id="p22004001_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;behold, you are beautiful!</span><br /><span id="p22004001_06-1" class="line">&nbsp;&nbsp;Your eyes are doves</span><br /><span id="p22004001_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;behind your veil.</span><br /><span id="p22004001_06-1" class="line">&nbsp;&nbsp;Your hair is like a flock of goats</span><br /><span id="p22004001_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;leaping down the slopes of Gilead.</span><br /><span id="p22004002_06-1" class="line"><b class="verse-num inline" id="v22004002-1">2&nbsp;</b>&nbsp;&nbsp;Your teeth are like a flock of shorn ewes</span><br /><span id="p22004002_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;that have come up from the washing,</span><br /><span id="p22004002_06-1" class="line">&nbsp;&nbsp;all of which bear twins,</span><br /><span id="p22004002_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and not one among them has lost its young.</span><br /><span id="p22004003_06-1" class="line"><b class="verse-num inline" id="v22004003-1">3&nbsp;</b>&nbsp;&nbsp;Your lips are like a scarlet thread,</span><br /><span id="p22004003_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and your mouth is lovely.</span><br /><span id="p22004003_06-1" class="line">&nbsp;&nbsp;Your cheeks are like halves of a pomegranate</span><br /><span id="p22004003_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;behind your veil.</span><br /><span id="p22004004_06-1" class="line"><b class="verse-num inline" id="v22004004-1">4&nbsp;</b>&nbsp;&nbsp;Your neck is like the tower of David,</span><br /><span id="p22004004_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;built in rows of stone;<sup class="footnote"><a class="fn" href="#f1-1" id="fb1-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;meaning-uncertain&quot;&gt;The meaning of the Hebrew word is uncertain&lt;/note&gt;">1</a></sup></span><br /><span id="p22004004_06-1" class="line">&nbsp;&nbsp;on it hang a thousand shields,</span><br /><span id="p22004004_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;all of them shields of warriors.</span><br /><span id="p22004005_06-1" class="line"><b class="verse-num inline" id="v22004005-1">5&nbsp;</b>&nbsp;&nbsp;Your two breasts are like two fawns,</span><br /><span id="p22004005_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;twins of a gazelle,</span><br /><span id="p22004005_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;that graze among the lilies.</span><br /><span id="p22004006_06-1" class="line"><b class="verse-num inline" id="v22004006-1">6&nbsp;</b>&nbsp;&nbsp;Until the day breathes</span><br /><span id="p22004006_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and the shadows flee,</span><br /><span id="p22004006_06-1" class="line">&nbsp;&nbsp;I will go away to the mountain of myrrh</span><br /><span id="p22004006_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and the hill of frankincense.</span><br /><span id="p22004007_06-1" class="line"><b class="verse-num inline" id="v22004007-1">7&nbsp;</b>&nbsp;&nbsp;You are altogether beautiful, my love;</span><br /><span id="p22004007_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;there is no flaw in you.</span><br /><span id="p22004008_06-1" class="line"><b class="verse-num inline" id="v22004008-1">8&nbsp;</b>&nbsp;&nbsp;Come with me from Lebanon, my bride;</span><br /><span id="p22004008_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;come with me from Lebanon.</span><br /><span id="p22004008_06-1" class="line">&nbsp;&nbsp;Depart<sup class="footnote"><a class="fn" href="#f2-1" id="fb2-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;Look&lt;/i&gt;&lt;/note&gt;">2</a></sup> from the peak of Amana,</span><br /><span id="p22004008_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;from the peak of Senir and Hermon,</span><br /><span id="p22004008_06-1" class="line">&nbsp;&nbsp;from the dens of lions,</span><br /><span id="p22004008_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;from the mountains of leopards.</span><br /><span class="end-line-group"></span>\n<span class="begin-line-group"></span>\n<span id="p22004009_06-1" class="line"><b class="verse-num inline" id="v22004009-1">9&nbsp;</b>&nbsp;&nbsp;You have captivated my heart, my sister, my bride;</span><br /><span id="p22004009_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;you have captivated my heart with one glance of your eyes,</span><br /><span id="p22004009_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;with one jewel of your necklace.</span><br /><span id="p22004010_06-1" class="line"><b class="verse-num inline" id="v22004010-1">10&nbsp;</b>&nbsp;&nbsp;How beautiful is your love, my sister, my bride!</span><br /><span id="p22004010_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;How much better is your love than wine,</span><br /><span id="p22004010_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and the fragrance of your oils than any spice!</span><br /><span id="p22004011_06-1" class="line"><b class="verse-num inline" id="v22004011-1">11&nbsp;</b>&nbsp;&nbsp;Your lips drip nectar, my bride;</span><br /><span id="p22004011_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;honey and milk are under your tongue;</span><br /><span id="p22004011_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;the fragrance of your garments is like the fragrance of Lebanon.</span><br /><span id="p22004012_06-1" class="line"><b class="verse-num inline" id="v22004012-1">12&nbsp;</b>&nbsp;&nbsp;A garden locked is my sister, my bride,</span><br /><span id="p22004012_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;a spring locked, a fountain sealed.</span><br /><span id="p22004013_06-1" class="line"><b class="verse-num inline" id="v22004013-1">13&nbsp;</b>&nbsp;&nbsp;Your shoots are an orchard of pomegranates</span><br /><span id="p22004013_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;with all choicest fruits,</span><br /><span id="p22004013_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;henna with nard,</span><br /><span id="p22004014_06-1" class="line"><b class="verse-num inline" id="v22004014-1">14&nbsp;</b>&nbsp;&nbsp;nard and saffron, calamus and cinnamon,</span><br /><span id="p22004014_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;with all trees of frankincense,</span><br /><span id="p22004014_06-1" class="line">&nbsp;&nbsp;myrrh and aloes,</span><br /><span id="p22004014_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;with all choice spices—</span><br /><span id="p22004015_06-1" class="line"><b class="verse-num inline" id="v22004015-1">15&nbsp;</b>&nbsp;&nbsp;a garden fountain, a well of living water,</span><br /><span id="p22004015_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and flowing streams from Lebanon.</span><br /><span class="end-line-group"></span>\n<span class="begin-line-group"></span>\n<span id="p22004016_06-1" class="line"><b class="verse-num inline" id="v22004016-1">16&nbsp;</b>&nbsp;&nbsp;Awake, O north wind,</span><br /><span id="p22004016_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and come, O south wind!</span><br /><span id="p22004016_06-1" class="line">&nbsp;&nbsp;Blow upon my garden,</span><br /><span id="p22004016_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;let its spices flow.</span><br /><span class="end-line-group"></span>\n</p><h3 id="p22004016_06-1">Together in the Garden of Love</h3>\n<p class="block-indent"><h4 id="p22004016_12-1" class="speaker">She</h4>\n<span class="begin-line-group"></span>\n<span id="p22004016_12-1" class="line">&nbsp;&nbsp;Let my beloved come to his garden,</span><br /><span id="p22004016_12-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;and eat its choicest fruits.</span><br /></p><span class="end-line-group"></span>\n<div class="footnotes extra_text">\n<h3>Footnotes</h3>\n<p><span class="footnote"><a href="#fb1-1" id="f1-1">[1]</a></span> <span class="footnote-ref">4:4</span> <note class="translation" sub-class="meaning-uncertain">The meaning of the Hebrew word is uncertain</note>\n<br />\n<span class="footnote"><a href="#fb2-1" id="f2-1">[2]</a></span> <span class="footnote-ref">4:8</span> <note class="alternative">Or <i>Look</i></note>\n</p>\n</div>\n<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`
    const result = parseChapter(verseHtml)
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
