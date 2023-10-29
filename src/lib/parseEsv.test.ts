import { expect, test } from 'vitest'

import { Paragraph, parseChapter, Verse } from './parseEsv'

export function sum(a: number, b: number): number {
    return a + b
}
test('parse James 1:1', () => {
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
    const firstVerse = firstParagraph.nodes.at(0)!
    const secondParagraph = result.nodes.at(3) as Paragraph
    const secondVerse = secondParagraph.nodes.at(0)!
    const thirdParagraph = result.nodes.at(4) as Paragraph

    expect(firstVerse.nodes.length).toBe(11)
    expect(secondVerse.nodes.length).toBe(7)
    expect(firstParagraph.verseMetadata?.offset).toBe(0)
    expect(secondParagraph.verseMetadata?.offset).toBe(10)
})

test('parse psalm 23:1', () => {
    const verseHtml = `"<h2 class="extra_text">Psalm 23 <small class="audio extra_text">(<a class="mp3link" href="https://audio.esv.org/david-cochran-heath/mq/19023001-19023006.mp3" title="Psalm 23" type="audio/mpeg">Listen</a>)</small></h2>
<h3 id="p19023001_01-1">The <span class="divine-name">Lord</span> Is My Shepherd</h3>
<h4 id="p19023001_06-1" class="psalm-title">A Psalm of David.</h4>
<p class="block-indent"><span class="begin-line-group"></span>
<span id="p19023001_06-1" class="line"><b class="chapter-num" id="v19023001-1">23:1&nbsp;</b>&nbsp;&nbsp;The LORD is my shepherd; I shall not want.</span><br /><span id="p19023002_06-1" class="indent line"><b class="verse-num inline" id="v19023002-1">2&nbsp;</b>&nbsp;&nbsp;&nbsp;&nbsp;He makes me lie down in green pastures.</span><br /><span id="p19023002_06-1" class="line">&nbsp;&nbsp;He leads me beside still waters.<sup class="footnote"><a class="fn" href="#f1-1" id="fb1-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Hebrew &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;beside&lt;/span&gt; waters of rest&lt;/i&gt;&lt;/note&gt;">1</a></sup></span><br /><span id="p19023003_06-1" class="indent line"><b class="verse-num inline" id="v19023003-1">3&nbsp;</b>&nbsp;&nbsp;&nbsp;&nbsp;He restores my soul.</span><br /><span id="p19023003_06-1" class="line">&nbsp;&nbsp;He leads me in paths of righteousness<sup class="footnote"><a class="fn" href="#f2-1" id="fb2-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;in&lt;/span&gt; right paths&lt;/i&gt;&lt;/note&gt;">2</a></sup></span><br /><span id="p19023003_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;for his name’s sake.</span><br /><span class="end-line-group"></span>
<span class="begin-line-group"></span>
<span id="p19023004_06-1" class="line"><b class="verse-num inline" id="v19023004-1">4&nbsp;</b>&nbsp;&nbsp;Even though I walk through the valley of the shadow of death,<sup class="footnote"><a class="fn" href="#f3-1" id="fb3-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;the valley of&lt;/span&gt; deep darkness&lt;/i&gt;&lt;/note&gt;">3</a></sup></span><br /><span id="p19023004_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;I will fear no evil,</span><br /><span id="p19023004_06-1" class="line">&nbsp;&nbsp;for you are with me;</span><br /><span id="p19023004_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;your rod and your staff,</span><br /><span id="p19023004_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;they comfort me.</span><br /><span class="end-line-group"></span>
<span class="begin-line-group"></span>
<span id="p19023005_06-1" class="line"><b class="verse-num inline" id="v19023005-1">5&nbsp;</b>&nbsp;&nbsp;You prepare a table before me</span><br /><span id="p19023005_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;in the presence of my enemies;</span><br /><span id="p19023005_06-1" class="line">&nbsp;&nbsp;you anoint my head with oil;</span><br /><span id="p19023005_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;my cup overflows.</span><br /><span id="p19023006_06-1" class="line"><b class="verse-num inline" id="v19023006-1">6&nbsp;</b>&nbsp;&nbsp;Surely<sup class="footnote"><a class="fn" href="#f4-1" id="fb4-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;Only&lt;/i&gt;&lt;/note&gt;">4</a></sup> goodness and mercy<sup class="footnote"><a class="fn" href="#f5-1" id="fb5-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;steadfast love&lt;/i&gt;&lt;/note&gt;">5</a></sup> shall follow me</span><br /><span id="p19023006_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;all the days of my life,</span><br /><span id="p19023006_06-1" class="line">&nbsp;&nbsp;and I shall dwell<sup class="footnote"><a class="fn" href="#f6-1" id="fb6-1" title="&lt;note class=&quot;alternative&quot;&gt;Or &lt;i&gt;&lt;span class=&quot;catch-word&quot;&gt;shall&lt;/span&gt; return to dwell&lt;/i&gt;&lt;/note&gt;">6</a></sup> in the house of the LORD</span><br /><span id="p19023006_06-1" class="indent line">&nbsp;&nbsp;&nbsp;&nbsp;forever.<sup class="footnote"><a class="fn" href="#f7-1" id="fb7-1" title="&lt;note class=&quot;translation&quot; sub-class=&quot;original&quot;&gt;Hebrew &lt;i&gt;for length of days&lt;/i&gt;&lt;/note&gt;">7</a></sup></span><br /></p><span class="end-line-group"></span>
<div class="footnotes extra_text">
<h3>Footnotes</h3>
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
})
