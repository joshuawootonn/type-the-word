import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'

import {
    Block,
    Paragraph,
    parseChapter,
    parseNextChapter,
    parsePrevChapter,
    Word,
} from './parseEsv'

/**
 * Helper to extract all words from a parsed passage.
 * Used to verify no words contain embedded newlines.
 */
function getAllWords(blocks: Block[]): Word[] {
    const words: Word[] = []

    for (const block of blocks) {
        if (block.type === 'paragraph') {
            for (const verse of block.nodes) {
                for (const node of verse.nodes) {
                    if (node.type === 'word') {
                        words.push(node)
                    }
                }
            }
        }
    }

    return words
}

/**
 * Checks if any word has a newline character in the middle of it
 * (not at the end, which is valid for line breaks).
 * A word like "Let\n" is fine (newline at end), but "Let\n him" parsed as one word is a bug.
 */
function hasEmbeddedNewline(word: Word): boolean {
    const letters = word.letters
    for (let i = 0; i < letters.length - 1; i++) {
        if (letters[i] === '\n') {
            return true
        }
    }
    return false
}

describe('parseEsv', () => {
    test('parse james 1:1', () => {
        const verseHtml = `<h2 class=extra_text>James 1:1–4 <small class="extra_text audio">(<a href=https://audio.esv.org/david-cochran-heath/mq/59001001-59001004.mp3 class=mp3link title="James 1:1–4"type=audio/mpeg>Listen</a>)</small></h2><h3 id=p59001001_01-1>Greeting</h3><p id=p59001001_02-1 class=starts-chapter><b class=chapter-num id=v59001001-1>1:1 </b>James, a servant<sup class=footnote><a href=#f1-1 class=fn title='<note class="translation" sub-class="bondservant">For the contextual rendering of the Greek word <i language="Greek">doulos</i>, see <a href="https://www.esv.org/preface/">Preface</a></note>'id=fb1-1>1</a></sup> of God and of the Lord Jesus Christ,<p id=p59001001_02-1>To the twelve tribes in the Dispersion:<p id=p59001001_02-1>Greetings.<h3 id=p59001001_02-1>Testing of Your Faith</h3><p id=p59001001_06-1><b class=verse-num id=v59001002-1>2 </b>Count it all joy, my brothers,<sup class=footnote><a href=#f2-1 class=fn title='<note class="translation" sub-class="gender-neutral">Or <i><span class="catch-word">brothers</span> and sisters</i>. In New Testament usage, depending on the context, the plural Greek word <i language="Greek">adelphoi</i> (translated “brothers”) may refer either to <i>brothers</i> or to <i>brothers and sisters</i>; also verses 16, 19</note>'id=fb2-1>2</a></sup> when you meet trials of various kinds, <b class=verse-num id=v59001003-1>3 </b>for you know that the testing of your faith produces steadfastness. <b class=verse-num id=v59001004-1>4 </b>And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.<div class="extra_text footnotes"><h3>Footnotes</h3><p><span class=footnote><a href=#fb1-1 id=f1-1>[1]</a></span> <span class=footnote-ref>1:1</span><note class=translation sub-class=bondservant>For the contextual rendering of the Greek word <i language=Greek>doulos</i>, see <a href=https://www.esv.org/preface/ >Preface</a></note><br><span class=footnote><a href=#fb2-1 id=f2-1>[2]</a></span> <span class=footnote-ref>1:2</span><note class=translation sub-class=gender-neutral>Or <i><span class=catch-word>brothers</span> and sisters</i>. In New Testament usage, depending on the context, the plural Greek word <i language=Greek>adelphoi</i> (translated “brothers”) may refer either to <i>brothers</i> or to <i>brothers and sisters</i>; also verses 16, 19</note></div><p>(<a href=http://www.esv.org class=copyright>ESV</a>)`

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

    test('parse psalm 23', () => {
        const verseHtml = `<h2 class=\"extra_text\">Psalm 23 <small class=\"audio extra_text\">(<a class=\"mp3link\" href=\"https://audio.esv.org/david-cochran-heath/mq/19023001-19023006.mp3\" title=\"Psalm 23\" type=\"audio/mpeg\">Listen</a>)</small></h2>\n<h3 id=\"p19023001_01-1\">The <span class=\"divine-name\">Lord</span> Is My Shepherd</h3>\n<h4 id=\"p19023001_06-1\" class=\"psalm-title\">A Psalm of David.</h4>\n<p class=\"block-indent\"><span class=\"begin-line-group\"></span>\n<span id=\"p19023001_06-1\" class=\"line\"><b class=\"chapter-num\" id=\"v19023001-1\">23:1&nbsp;</b>&nbsp;&nbsp;The LORD is my shepherd; I shall not want.</span><br /><span id=\"p19023002_06-1\" class=\"indent line\"><b class=\"verse-num inline\" id=\"v19023002-1\">2&nbsp;</b>&nbsp;&nbsp;&nbsp;&nbsp;He makes me lie down in green pastures.</span><br /><span id=\"p19023002_06-1\" class=\"line\">&nbsp;&nbsp;He leads me beside still waters.<sup class=\"footnote\"><a class=\"fn\" href=\"#f1-1\" id=\"fb1-1\" title=\"&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Hebrew &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;beside&lt;/span&gt; waters of rest&lt;/i&gt;&lt;/note&gt;\">1</a></sup></span><br /><span id=\"p19023003_06-1\" class=\"indent line\"><b class=\"verse-num inline\" id=\"v19023003-1\">3&nbsp;</b>&nbsp;&nbsp;&nbsp;&nbsp;He restores my soul.</span><br /><span id=\"p19023003_06-1\" class=\"line\">&nbsp;&nbsp;He leads me in paths of righteousness<sup class=\"footnote\"><a class=\"fn\" href=\"#f2-1\" id=\"fb2-1\" title=\"&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;in&lt;/span&gt; right paths&lt;/i&gt;&lt;/note&gt;\">2</a></sup></span><br /><span id=\"p19023003_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;for his name’s sake.</span><br /><span class=\"end-line-group\"></span>\n<span class=\"begin-line-group\"></span>\n<span id=\"p19023004_06-1\" class=\"line\"><b class=\"verse-num inline\" id=\"v19023004-1\">4&nbsp;</b>&nbsp;&nbsp;Even though I walk through the valley of the shadow of death,<sup class=\"footnote\"><a class=\"fn\" href=\"#f3-1\" id=\"fb3-1\" title=\"&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;the valley of&lt;/span&gt; deep darkness&lt;/i&gt;&lt;/note&gt;\">3</a></sup></span><br /><span id=\"p19023004_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;I will fear no evil,</span><br /><span id=\"p19023004_06-1\" class=\"line\">&nbsp;&nbsp;for you are with me;</span><br /><span id=\"p19023004_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;your rod and your staff,</span><br /><span id=\"p19023004_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;they comfort me.</span><br /><span class=\"end-line-group\"></span>\n<span class=\"begin-line-group\"></span>\n<span id=\"p19023005_06-1\" class=\"line\"><b class=\"verse-num inline\" id=\"v19023005-1\">5&nbsp;</b>&nbsp;&nbsp;You prepare a table before me</span><br /><span id=\"p19023005_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;in the presence of my enemies;</span><br /><span id=\"p19023005_06-1\" class=\"line\">&nbsp;&nbsp;you anoint my head with oil;</span><br /><span id=\"p19023005_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;my cup overflows.</span><br /><span id=\"p19023006_06-1\" class=\"line\"><b class=\"verse-num inline\" id=\"v19023006-1\">6&nbsp;</b>&nbsp;&nbsp;Surely<sup class=\"footnote\"><a class=\"fn\" href=\"#f4-1\" id=\"fb4-1\" title=\"&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;Only&lt;/i&gt;&lt;/note&gt;\">4</a></sup> goodness and mercy<sup class=\"footnote\"><a class=\"fn\" href=\"#f5-1\" id=\"fb5-1\" title=\"&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;steadfast love&lt;/i&gt;&lt;/note&gt;\">5</a></sup> shall follow me</span><br /><span id=\"p19023006_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;all the days of my life,</span><br /><span id=\"p19023006_06-1\" class=\"line\">&nbsp;&nbsp;and I shall dwell<sup class=\"footnote\"><a class=\"fn\" href=\"#f6-1\" id=\"fb6-1\" title=\"&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;shall&lt;/span&gt; return to dwell&lt;/i&gt;&lt;/note&gt;\">6</a></sup> in the house of the LORD</span><br /><span id=\"p19023006_06-1\" class=\"indent line\">&nbsp;&nbsp;&nbsp;&nbsp;forever.<sup class=\"footnote\"><a class=\"fn\" href=\"#f7-1\" id=\"fb7-1\" title=\"&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Hebrew &lt;i&gt;for length of days&lt;/i&gt;&lt;/note&gt;\">7</a></sup></span><br /></p><span class=\"end-line-group\"></span>\n<div class=\"footnotes extra_text\">\n<h3>Footnotes</h3>\n<p><span class=\"footnote\"><a href=\"#fb1-1\" id=\"f1-1\">[1]</a></span> <span class=\"footnote-ref\">23:2</span> <note class=\"translation\" sub-class=\"original\">Hebrew <i><span class=\"catch-word\">beside</span> waters of rest</i></note>\n<br />\n<span class=\"footnote\"><a href=\"#fb2-1\" id=\"f2-1\">[2]</a></span> <span class=\"footnote-ref\">23:3</span> <note class=\"alternative\">Or <i><span class=\"catch-word\">in</span> right paths</i></note>\n<br />\n<span class=\"footnote\"><a href=\"#fb3-1\" id=\"f3-1\">[3]</a></span> <span class=\"footnote-ref\">23:4</span> <note class=\"alternative\">Or <i><span class=\"catch-word\">the valley of</span> deep darkness</i></note>\n<br />\n<span class=\"footnote\"><a href=\"#fb4-1\" id=\"f4-1\">[4]</a></span> <span class=\"footnote-ref\">23:6</span> <note class=\"alternative\">Or <i>Only</i></note>\n<br />\n<span class=\"footnote\"><a href=\"#fb5-1\" id=\"f5-1\">[5]</a></span> <span class=\"footnote-ref\">23:6</span> <note class=\"alternative\">Or <i>steadfast love</i></note>\n<br />\n<span class=\"footnote\"><a href=\"#fb6-1\" id=\"f6-1\">[6]</a></span> <span class=\"footnote-ref\">23:6</span> <note class=\"alternative\">Or <i><span class=\"catch-word\">shall</span> return to dwell</i></note>\n<br />\n<span class=\"footnote\"><a href=\"#fb7-1\" id=\"f7-1\">[7]</a></span> <span class=\"footnote-ref\">23:6</span> <note class=\"translation\" sub-class=\"original\">Hebrew <i>for length of days</i></note>\n</p>\n</div>\n<p>(<a href=\"http://www.esv.org\" class=\"copyright\">ESV</a>)</p>`

        const result = parseChapter(verseHtml)
        const firstParagraph = result.nodes.at(3) as Paragraph
        const firstVerse = firstParagraph.nodes.at(0)!
        const secondVerse = firstParagraph.nodes.at(1)!

        expect(firstVerse.nodes.length).toBe(13)
        expect(secondVerse.nodes.length).toBe(23)
    })

    test('parse 1 peter 1', () => {
        const verseHtml = `<h2 class=extra_text>1 Peter 1 <small class="extra_text audio">(<a href=https://audio.esv.org/david-cochran-heath/mq/60001001-60001025.mp3 class=mp3link title="1 Peter 1"type=audio/mpeg>Listen</a>)</small></h2><h3 id=p60001001_01-1>Greeting</h3><p id=p60001001_02-1 class=starts-chapter><b class=chapter-num id=v60001001-1>1:1 </b>Peter, an apostle of Jesus Christ,<p id=p60001001_02-1>To those who are elect exiles of the Dispersion in Pontus, Galatia, Cappadocia, Asia, and Bithynia, <b class=verse-num id=v60001002-1>2 </b>according to the foreknowledge of God the Father, in the sanctification of the Spirit, for obedience to Jesus Christ and for sprinkling with his blood:<p id=p60001002_02-1>May grace and peace be multiplied to you.<h3 id=p60001002_02-1>Born Again to a Living Hope</h3><p id=p60001002_08-1><b class=verse-num id=v60001003-1>3 </b>Blessed be the God and Father of our Lord Jesus Christ! According to his great mercy, he has caused us to be born again to a living hope through the resurrection of Jesus Christ from the dead, <b class=verse-num id=v60001004-1>4 </b>to an inheritance that is imperishable, undefiled, and unfading, kept in heaven for you, <b class=verse-num id=v60001005-1>5 </b>who by God’s power are being guarded through faith for a salvation ready to be revealed in the last time. <b class=verse-num id=v60001006-1>6 </b>In this you rejoice, though now for a little while, if necessary, you have been grieved by various trials, <b class=verse-num id=v60001007-1>7 </b>so that the tested genuineness of your faith—more precious than gold that perishes though it is tested by fire—may be found to result in praise and glory and honor at the revelation of Jesus Christ. <b class=verse-num id=v60001008-1>8 </b>Though you have not seen him, you love him. Though you do not now see him, you believe in him and rejoice with joy that is inexpressible and filled with glory, <b class=verse-num id=v60001009-1>9 </b>obtaining the outcome of your faith, the salvation of your souls.<p id=p60001009_08-1><b class=verse-num id=v60001010-1>10 </b>Concerning this salvation, the prophets who prophesied about the grace that was to be yours searched and inquired carefully, <b class=verse-num id=v60001011-1>11 </b>inquiring what person or time<sup class=footnote><a href=#f1-1 class=fn title='<note class="alternative">Or <i>what time or circumstances</i></note>'id=fb1-1>1</a></sup> the Spirit of Christ in them was indicating when he predicted the sufferings of Christ and the subsequent glories. <b class=verse-num id=v60001012-1>12 </b>It was revealed to them that they were serving not themselves but you, in the things that have now been announced to you through those who preached the good news to you by the Holy Spirit sent from heaven, things into which angels long to look.<h3 id=p60001012_08-1>Called to Be Holy</h3><p id=p60001012_12-1><b class=verse-num id=v60001013-1>13 </b>Therefore, preparing your minds for action,<sup class=footnote><a href=#f2-1 class=fn title='<note class="translation" sub-class="original">Greek <i>girding up the loins of your mind</i></note>'id=fb2-1>2</a></sup> and being sober-minded, set your hope fully on the grace that will be brought to you at the revelation of Jesus Christ. <b class=verse-num id=v60001014-1>14 </b>As obedient children, do not be conformed to the passions of your former ignorance, <b class=verse-num id=v60001015-1>15 </b>but as he who called you is holy, you also be holy in all your conduct, <b class=verse-num id=v60001016-1>16 </b>since it is written, “You shall be holy, for I am holy.” <b class=verse-num id=v60001017-1>17 </b>And if you call on him as Father who judges impartially according to each one’s deeds, conduct yourselves with fear throughout the time of your exile, <b class=verse-num id=v60001018-1>18 </b>knowing that you were ransomed from the futile ways inherited from your forefathers, not with perishable things such as silver or gold, <b class=verse-num id=v60001019-1>19 </b>but with the precious blood of Christ, like that of a lamb without blemish or spot. <b class=verse-num id=v60001020-1>20 </b>He was foreknown before the foundation of the world but was made manifest in the last times for the sake of you <b class=verse-num id=v60001021-1>21 </b>who through him are believers in God, who raised him from the dead and gave him glory, so that your faith and hope are in God.<p id=p60001021_12-1><b class=verse-num id=v60001022-1>22 </b>Having purified your souls by your obedience to the truth for a sincere brotherly love, love one another earnestly from a pure heart, <b class=verse-num id=v60001023-1>23 </b>since you have been born again, not of perishable seed but of imperishable, through the living and abiding word of God; <b class=verse-num id=v60001024-1>24 </b>for<p class=block-indent><span class=begin-line-group></span> <span class=line id=p60001024_12-1>  “All flesh is like grass</span><br><span class="line indent"id=p60001024_12-1>    and all its glory like the flower of grass.</span><br><span class=line id=p60001024_12-1>  The grass withers,</span><br><span class="line indent"id=p60001024_12-1>    and the flower falls,</span><br><span class=line id=p60001025_12-1><b class="verse-num inline"id=v60001025-1>25 </b>  but the word of the Lord remains forever.”</span><br><span class=end-line-group></span><p id=p60001025_12-1 class=same-paragraph>And this word is the good news that was preached to you.<div class="extra_text footnotes"><h3>Footnotes</h3><p><span class=footnote><a href=#fb1-1 id=f1-1>[1]</a></span> <span class=footnote-ref>1:11</span><note class=alternative>Or <i>what time or circumstances</i></note><br><span class=footnote><a href=#fb2-1 id=f2-1>[2]</a></span> <span class=footnote-ref>1:13</span><note class=translation sub-class=original>Greek <i>girding up the loins of your mind</i></note></div><p>(<a href=http://www.esv.org class=copyright>ESV</a>)`
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
        const verseHtml = `<h2 class=extra_text>Song of Solomon 4 <small class="extra_text audio">(<a href=https://audio.esv.org/david-cochran-heath/mq/22004001-22004016.mp3 class=mp3link title="Song of Solomon 4"type=audio/mpeg>Listen</a>)</small></h2><h3 id=p22004001_01-1>Solomon Admires His Bride’s Beauty</h3><h4 class=speaker id=p22004001_06-1>He</h4><p class=block-indent><span class=begin-line-group></span><span class=line id=p22004001_06-1><b class=chapter-num id=v22004001-1>4:1 </b>  Behold, you are beautiful, my love,</span><br><span class="line indent"id=p22004001_06-1>    behold, you are beautiful!</span><br><span class=line id=p22004001_06-1>  Your eyes are doves</span><br><span class="line indent"id=p22004001_06-1>    behind your veil.</span><br><span class=line id=p22004001_06-1>  Your hair is like a flock of goats</span><br><span class="line indent"id=p22004001_06-1>    leaping down the slopes of Gilead.</span><br><span class=line id=p22004002_06-1><b class="inline verse-num"id=v22004002-1>2 </b>  Your teeth are like a flock of shorn ewes</span><br><span class="line indent"id=p22004002_06-1>    that have come up from the washing,</span><br><span class=line id=p22004002_06-1>  all of which bear twins,</span><br><span class="line indent"id=p22004002_06-1>    and not one among them has lost its young.</span><br><span class=line id=p22004003_06-1><b class="inline verse-num"id=v22004003-1>3 </b>  Your lips are like a scarlet thread,</span><br><span class="line indent"id=p22004003_06-1>    and your mouth is lovely.</span><br><span class=line id=p22004003_06-1>  Your cheeks are like halves of a pomegranate</span><br><span class="line indent"id=p22004003_06-1>    behind your veil.</span><br><span class=line id=p22004004_06-1><b class="inline verse-num"id=v22004004-1>4 </b>  Your neck is like the tower of David,</span><br><span class="line indent"id=p22004004_06-1>    built in rows of stone;<sup class=footnote><a href=#f1-1 class=fn title='<note class="translation" sub-class="meaning-uncertain">The meaning of the Hebrew word is uncertain</note>'id=fb1-1>1</a></sup></span><br><span class=line id=p22004004_06-1>  on it hang a thousand shields,</span><br><span class="line indent"id=p22004004_06-1>    all of them shields of warriors.</span><br><span class=line id=p22004005_06-1><b class="inline verse-num"id=v22004005-1>5 </b>  Your two breasts are like two fawns,</span><br><span class="line indent"id=p22004005_06-1>    twins of a gazelle,</span><br><span class="line indent"id=p22004005_06-1>    that graze among the lilies.</span><br><span class=line id=p22004006_06-1><b class="inline verse-num"id=v22004006-1>6 </b>  Until the day breathes</span><br><span class="line indent"id=p22004006_06-1>    and the shadows flee,</span><br><span class=line id=p22004006_06-1>  I will go away to the mountain of myrrh</span><br><span class="line indent"id=p22004006_06-1>    and the hill of frankincense.</span><br><span class=line id=p22004007_06-1><b class="inline verse-num"id=v22004007-1>7 </b>  You are altogether beautiful, my love;</span><br><span class="line indent"id=p22004007_06-1>    there is no flaw in you.</span><br><span class=line id=p22004008_06-1><b class="inline verse-num"id=v22004008-1>8 </b>  Come with me from Lebanon, my bride;</span><br><span class="line indent"id=p22004008_06-1>    come with me from Lebanon.</span><br><span class=line id=p22004008_06-1>  Depart<sup class=footnote><a href=#f2-1 class=fn title='<note class="alternative">Or <i>Look</i></note>'id=fb2-1>2</a></sup> from the peak of Amana,</span><br><span class="line indent"id=p22004008_06-1>    from the peak of Senir and Hermon,</span><br><span class=line id=p22004008_06-1>  from the dens of lions,</span><br><span class="line indent"id=p22004008_06-1>    from the mountains of leopards.</span><br><span class=end-line-group></span><span class=begin-line-group></span><span class=line id=p22004009_06-1><b class="inline verse-num"id=v22004009-1>9 </b>  You have captivated my heart, my sister, my bride;</span><br><span class="line indent"id=p22004009_06-1>    you have captivated my heart with one glance of your eyes,</span><br><span class="line indent"id=p22004009_06-1>    with one jewel of your necklace.</span><br><span class=line id=p22004010_06-1><b class="inline verse-num"id=v22004010-1>10 </b>  How beautiful is your love, my sister, my bride!</span><br><span class="line indent"id=p22004010_06-1>    How much better is your love than wine,</span><br><span class="line indent"id=p22004010_06-1>    and the fragrance of your oils than any spice!</span><br><span class=line id=p22004011_06-1><b class="inline verse-num"id=v22004011-1>11 </b>  Your lips drip nectar, my bride;</span><br><span class="line indent"id=p22004011_06-1>    honey and milk are under your tongue;</span><br><span class="line indent"id=p22004011_06-1>    the fragrance of your garments is like the fragrance of Lebanon.</span><br><span class=line id=p22004012_06-1><b class="inline verse-num"id=v22004012-1>12 </b>  A garden locked is my sister, my bride,</span><br><span class="line indent"id=p22004012_06-1>    a spring locked, a fountain sealed.</span><br><span class=line id=p22004013_06-1><b class="inline verse-num"id=v22004013-1>13 </b>  Your shoots are an orchard of pomegranates</span><br><span class="line indent"id=p22004013_06-1>    with all choicest fruits,</span><br><span class="line indent"id=p22004013_06-1>    henna with nard,</span><br><span class=line id=p22004014_06-1><b class="inline verse-num"id=v22004014-1>14 </b>  nard and saffron, calamus and cinnamon,</span><br><span class="line indent"id=p22004014_06-1>    with all trees of frankincense,</span><br><span class=line id=p22004014_06-1>  myrrh and aloes,</span><br><span class="line indent"id=p22004014_06-1>    with all choice spices—</span><br><span class=line id=p22004015_06-1><b class="inline verse-num"id=v22004015-1>15 </b>  a garden fountain, a well of living water,</span><br><span class="line indent"id=p22004015_06-1>    and flowing streams from Lebanon.</span><br><span class=end-line-group></span><span class=begin-line-group></span><span class=line id=p22004016_06-1><b class="inline verse-num"id=v22004016-1>16 </b>  Awake, O north wind,</span><br><span class="line indent"id=p22004016_06-1>    and come, O south wind!</span><br><span class=line id=p22004016_06-1>  Blow upon my garden,</span><br><span class="line indent"id=p22004016_06-1>    let its spices flow.</span><br><span class=end-line-group></span><h3 id=p22004016_06-1>Together in the Garden of Love</h3><h4 class=speaker id=p22004016_12-1>She</h4><p class=block-indent><span class=begin-line-group></span><span class=line id=p22004016_12-1>  Let my beloved come to his garden,</span><br><span class="line indent"id=p22004016_12-1>    and eat its choicest fruits.</span><br><span class=end-line-group></span><div class="extra_text footnotes"><h3>Footnotes</h3><p><span class=footnote><a href=#fb1-1 id=f1-1>[1]</a></span> <span class=footnote-ref>4:4</span><note class=translation sub-class=meaning-uncertain>The meaning of the Hebrew word is uncertain</note><br><span class=footnote><a href=#fb2-1 id=f2-1>[2]</a></span> <span class=footnote-ref>4:8</span><note class=alternative>Or <i>Look</i></note></div><p>(<a href=http://www.esv.org class=copyright>ESV</a>)`
        const result = parseChapter(verseHtml)
    })

    // Testing james 4 because there is a "-" at the end of verse 13
    test('parse james 4', () => {
        const verseHtml = `<h2 class="extra_text">James 4 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/59004001-59004017.mp3" title="James 4" type="audio/mpeg">Listen</a>)</small></h2>\\n<h3 id="p59004001_01-1">Warning Against Worldliness</h3>\\n<p id="p59004001_04-1" class="starts-chapter"><b class="chapter-num" id="v59004001-1">4:1&nbsp;</b>What causes quarrels and what causes fights among you? Is it not this, that your passions<sup class="footnote"><a class="fn" href="#f1-1" id="fb1-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Greek &lt;i&gt;pleasures&lt;/i&gt;; also verse 3&lt;/note&gt;">1</a></sup> are at war within you?<sup class="footnote"><a class="fn" href="#f2-1" id="fb2-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Greek &lt;i&gt;in your members&lt;/i&gt;&lt;/note&gt;">2</a></sup> <b class="verse-num" id="v59004002-1">2&nbsp;</b>You desire and do not have, so you murder. You covet and cannot obtain, so you fight and quarrel. You do not have, because you do not ask. <b class="verse-num" id="v59004003-1">3&nbsp;</b>You ask and do not receive, because you ask wrongly, to spend it on your passions. <b class="verse-num" id="v59004004-1">4&nbsp;</b>You adulterous people!<sup class="footnote"><a class="fn" href="#f3-1" id="fb3-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;You&lt;/span&gt; adulteresses!&lt;/i&gt;&lt;/note&gt;">3</a></sup> Do you not know that friendship with the world is enmity with God? Therefore whoever wishes to be a friend of the world makes himself an enemy of God. <b class="verse-num" id="v59004005-1">5&nbsp;</b>Or do you suppose it is to no purpose that the Scripture says, “He yearns jealously over the spirit that he has made to dwell in us”? <b class="verse-num" id="v59004006-1">6&nbsp;</b>But he gives more grace. Therefore it says, “God opposes the proud but gives grace to the humble.” <b class="verse-num" id="v59004007-1">7&nbsp;</b>Submit yourselves therefore to God. Resist the devil, and he will flee from you. <b class="verse-num" id="v59004008-1">8&nbsp;</b>Draw near to God, and he will draw near to you. Cleanse your hands, you sinners, and purify your hearts, you double-minded. <b class="verse-num" id="v59004009-1">9&nbsp;</b>Be wretched and mourn and weep. Let your laughter be turned to mourning and your joy to gloom. <b class="verse-num" id="v59004010-1">10&nbsp;</b>Humble yourselves before the Lord, and he will exalt you.</p>\\n<p id="p59004010_04-1"><b class="verse-num" id="v59004011-1">11&nbsp;</b>Do not speak evil against one another, brothers.<sup class="footnote"><a class="fn" href="#f4-1" id="fb4-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;gender-neutral&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;brothers&lt;/span&gt; and sisters&lt;/i&gt;&lt;/note&gt;">4</a></sup> The one who speaks against a brother or judges his brother, speaks evil against the law and judges the law. But if you judge the law, you are not a doer of the law but a judge. <b class="verse-num" id="v59004012-1">12&nbsp;</b>There is only one lawgiver and judge, he who is able to save and to destroy. But who are you to judge your neighbor?</p>\\n<h3 id="p59004012_04-1">Boasting About Tomorrow</h3>\\n<p id="p59004012_07-1"><b class="verse-num" id="v59004013-1">13&nbsp;</b>Come now, you who say, “Today or tomorrow we will go into such and such a town and spend a year there and trade and make a profit”—<b class="verse-num" id="v59004014-1">14&nbsp;</b>yet you do not know what tomorrow will bring. What is your life? For you are a mist that appears for a little time and then vanishes. <b class="verse-num" id="v59004015-1">15&nbsp;</b>Instead you ought to say, “If the Lord wills, we will live and do this or that.” <b class="verse-num" id="v59004016-1">16&nbsp;</b>As it is, you boast in your arrogance. All such boasting is evil. <b class="verse-num" id="v59004017-1">17&nbsp;</b>So whoever knows the right thing to do and fails to do it, for him it is sin.</p>\\n<div class="footnotes extra_text">\\n<h3>Footnotes</h3>\\n<p><span class="footnote"><a href="#fb1-1" id="f1-1">[1]</a></span> <span class="footnote-ref">4:1</span> <note class="translation" sub-class="original">Greek <i>pleasures</i>; also verse 3</note>\\n<br />\\n<span class="footnote"><a href="#fb2-1" id="f2-1">[2]</a></span> <span class="footnote-ref">4:1</span> <note class="translation" sub-class="original">Greek <i>in your members</i></note>\\n<br />\\n<span class="footnote"><a href="#fb3-1" id="f3-1">[3]</a></span> <span class="footnote-ref">4:4</span> <note class="alternative">Or <i><span class="catch-word">You</span> adulteresses!</i></note>\\n<br />\\n<span class="footnote"><a href="#fb4-1" id="f4-1">[4]</a></span> <span class="footnote-ref">4:11</span> <note class="translation" sub-class="gender-neutral">Or <i><span class="catch-word">brothers</span> and sisters</i></note>\\n</p>\\n</div>\\n<p>(<a href="http://www.esv.org" class="copyright">ESV</a>)</p>`

        const result = parseChapter(verseHtml)
        const firstParagraph = result.nodes.at(5) as Paragraph
        const fourteenthVerse = firstParagraph.nodes.at(0)!

        expect(
            fourteenthVerse.nodes.filter(node => node.type === 'word').length,
        ).toBe(28)
    })

    // Testing psalm 145 becuase 13 includes a bracketed section
    test('parse psalm 145:13', () => {
        const verseHtml = `<h2 class=extra_text>Psalm 145 <small class="extra_text audio">(<a href=https://audio.esv.org/david-cochran-heath/mq/19145001-19145021.mp3 class=mp3link title="Psalm 145"type=audio/mpeg>Listen</a>)</small></h2>\n<h3 id=p19145001_01-1>Great Is the <span class=divine-name>Lord</span></h3>\n<h4 class=psalm-title id=p19145001_05-1><sup class=footnote><a href=#f1-1 class=fn title='<note class="explanation" sub-class="acrostic">This psalm is an acrostic poem, each verse beginning with the successive letters of the Hebrew alphabet</note>'id=fb1-1>1</a></sup> A Song of Praise. Of David.</h4>\n<p class=block-indent><span class=begin-line-group></span>\n<span class=line id=p19145001_05-1><b class=chapter-num id=v19145001-1>145:1 </b>  I will extol you, my God and King,</span><br><span class="line indent"id=p19145001_05-1>    and bless your name forever and ever.</span><br><span class=line id=p19145002_05-1><b class="inline verse-num"id=v19145002-1>2 </b>  Every day I will bless you</span><br><span class="line indent"id=p19145002_05-1>    and praise your name forever and ever.</span><br><span class=line id=p19145003_05-1><b class="inline verse-num"id=v19145003-1>3 </b>  Great is the LORD, and greatly to be praised,</span><br><span class="line indent"id=p19145003_05-1>    and his greatness is unsearchable.</span><br><span class=end-line-group></span>\n<span class=begin-line-group></span>\n<span class=line id=p19145004_05-1><b class="inline verse-num"id=v19145004-1>4 </b>  One generation shall commend your works to another,</span><br><span class="line indent"id=p19145004_05-1>    and shall declare your mighty acts.</span><br><span class=line id=p19145005_05-1><b class="inline verse-num"id=v19145005-1>5 </b>  On the glorious splendor of your majesty,</span><br><span class="line indent"id=p19145005_05-1>    and on your wondrous works, I will meditate.</span><br><span class=line id=p19145006_05-1><b class="inline verse-num"id=v19145006-1>6 </b>  They shall speak of the might of your awesome deeds,</span><br><span class="line indent"id=p19145006_05-1>    and I will declare your greatness.</span><br><span class=line id=p19145007_05-1><b class="inline verse-num"id=v19145007-1>7 </b>  They shall pour forth the fame of your abundant goodness</span><br><span class="line indent"id=p19145007_05-1>    and shall sing aloud of your righteousness.</span><br><span class=end-line-group></span>\n<span class=begin-line-group></span>\n<span class=line id=p19145008_05-1><b class="inline verse-num"id=v19145008-1>8 </b>  The LORD is gracious and merciful,</span><br><span class="line indent"id=p19145008_05-1>    slow to anger and abounding in steadfast love.</span><br><span class=line id=p19145009_05-1><b class="inline verse-num"id=v19145009-1>9 </b>  The LORD is good to all,</span><br><span class="line indent"id=p19145009_05-1>    and his mercy is over all that he has made.</span><br><span class=end-line-group></span>\n<span class=begin-line-group></span>\n<span class=line id=p19145010_05-1><b class="inline verse-num"id=v19145010-1>10 </b>  All your works shall give thanks to you, O LORD,</span><br><span class="line indent"id=p19145010_05-1>    and all your saints shall bless you!</span><br><span class=line id=p19145011_05-1><b class="inline verse-num"id=v19145011-1>11 </b>  They shall speak of the glory of your kingdom</span><br><span class="line indent"id=p19145011_05-1>    and tell of your power,</span><br><span class=line id=p19145012_05-1><b class="inline verse-num"id=v19145012-1>12 </b>  to make known to the children of man your<sup class=footnote><a href=#f2-1 class=fn title='<note class="translation" sub-class="original">Hebrew <i>his</i>; also next line</note>'id=fb2-1>2</a></sup> mighty deeds,</span><br><span class="line indent"id=p19145012_05-1>    and the glorious splendor of your kingdom.</span><br><span class=line id=p19145013_05-1><b class="inline verse-num"id=v19145013-1>13 </b>  Your kingdom is an everlasting kingdom,</span><br><span class="line indent"id=p19145013_05-1>    and your dominion endures throughout all generations.</span><br><span class=end-line-group></span>\n<span class=begin-line-group></span>\n<span class=line id=p19145013_05-1>  [The LORD is faithful in all his words</span><br><span class="line indent"id=p19145013_05-1>    and kind in all his works.]<sup class=footnote><a href=#f3-1 class=fn title='<note class="variant">These two lines are supplied by one Hebrew manuscript, Septuagint, Syriac (compare Dead Sea Scroll)</note>'id=fb3-1>3</a></sup></span><br><span class=line id=p19145014_05-1><b class="inline verse-num"id=v19145014-1>14 </b>  The LORD upholds all who are falling</span><br><span class="line indent"id=p19145014_05-1>    and raises up all who are bowed down.</span><br><span class=line id=p19145015_05-1><b class="inline verse-num"id=v19145015-1>15 </b>  The eyes of all look to you,</span><br><span class="line indent"id=p19145015_05-1>    and you give them their food in due season.</span><br><span class=line id=p19145016_05-1><b class="inline verse-num"id=v19145016-1>16 </b>  You open your hand;</span><br><span class="line indent"id=p19145016_05-1>    you satisfy the desire of every living thing.</span><br><span class=line id=p19145017_05-1><b class="inline verse-num"id=v19145017-1>17 </b>  The LORD is righteous in all his ways</span><br><span class="line indent"id=p19145017_05-1>    and kind in all his works.</span><br><span class=line id=p19145018_05-1><b class="inline verse-num"id=v19145018-1>18 </b>  The LORD is near to all who call on him,</span><br><span class="line indent"id=p19145018_05-1>    to all who call on him in truth.</span><br><span class=line id=p19145019_05-1><b class="inline verse-num"id=v19145019-1>19 </b>  He fulfills the desire of those who fear him;</span><br><span class="line indent"id=p19145019_05-1>    he also hears their cry and saves them.</span><br><span class=line id=p19145020_05-1><b class="inline verse-num"id=v19145020-1>20 </b>  The LORD preserves all who love him,</span><br><span class="line indent"id=p19145020_05-1>    but all the wicked he will destroy.</span><br><span class=end-line-group></span>\n<span class=begin-line-group></span>\n<span class=line id=p19145021_05-1><b class="inline verse-num"id=v19145021-1>21 </b>  My mouth will speak the praise of the LORD,</span><br><span class="line indent"id=p19145021_05-1>    and let all flesh bless his holy name forever and ever.</span><br></p><span class=end-line-group></span>\n<div class="extra_text footnotes">\n<h3>Footnotes</h3>\n<p><span class=footnote><a href=#fb1-1 id=f1-1>[1]</a></span> <span class=footnote-ref>145:1</span><note class=explanation sub-class=acrostic>This psalm is an acrostic poem, each verse \n<p>(<a href=http://www.esv.org class=copyright>ESV</a>)</p>`
        const result = parseChapter(verseHtml)
        const firstParagraph = result.nodes.at(3) as Paragraph
        const thirteenthVerse = firstParagraph.nodes.at(12)!

        expect(
            thirteenthVerse.nodes.filter(node => node.type === 'word').length,
        ).toBe(27)
    })
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

describe('Song of Solomon HTML files - no embedded newlines in words', () => {
    const serverDir = path.join(process.cwd(), 'src/server')

    // These files had a bug where text split across lines in the HTML source
    // caused words to contain embedded newlines (e.g., "Let\n        him" as one word).
    // This made it impossible to type past certain words.
    const songOfSolomonFiles = [
        'song_of_solomon_1.html',
        'song_of_solomon_2.html',
        'song_of_solomon_3.html',
        'song_of_solomon_4.html',
        'song_of_solomon_5.html',
        'song_of_solomon_6.html',
        'song_of_solomon_7.html',
        'song_of_solomon_8.html',
    ]

    test.each(songOfSolomonFiles)(
        '%s has no words with embedded newlines',
        filename => {
            const filePath = path.join(serverDir, filename)
            const content = fs.readFileSync(filePath, { encoding: 'utf8' })
            const parsed = parseChapter(content)
            const words = getAllWords(parsed.nodes)

            const wordsWithEmbeddedNewlines = words.filter(hasEmbeddedNewline)

            if (wordsWithEmbeddedNewlines.length > 0) {
                const examples = wordsWithEmbeddedNewlines
                    .slice(0, 3)
                    .map(w => `"${w.letters.join('')}"`)
                    .join(', ')
                throw new Error(
                    `Found ${wordsWithEmbeddedNewlines.length} word(s) with embedded newlines: ${examples}`,
                )
            }

            expect(wordsWithEmbeddedNewlines).toHaveLength(0)
        },
    )
})
