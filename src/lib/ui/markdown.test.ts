import { describe, expect, it } from 'vitest';
import { inlineMarkdown, markdown } from './markdown';

describe('markdown', () => {
	it('renders inline emphasis and escapes HTML', () => {
		expect(inlineMarkdown('*mit* takes the **Dativ** <b>x</b>')).toBe(
			'<em>mit</em> takes the <strong>Dativ</strong> &lt;b&gt;x&lt;/b&gt;'
		);
		expect(inlineMarkdown('den*alten*')).toBe('den*alten*');
	});
	it('renders lists, headings and paragraphs', () => {
		const html = markdown(
			'### Weak endings\nAfter the article:\n- **-e** in five spots\n- **-en** elsewhere\n\nDone.'
		);
		expect(html).toBe(
			'<h5>Weak endings</h5>\n<p>After the article:</p>\n<ul><li><strong>-e</strong> in five spots</li><li><strong>-en</strong> elsewhere</li></ul>\n<p>Done.</p>'
		);
	});
	it('joins consecutive lines into one paragraph', () => {
		expect(markdown('one\ntwo')).toBe('<p>one two</p>');
	});
});
