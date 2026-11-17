/**
 * Minimal Markdown → HTML for our own content (lesson rules, explanations):
 * paragraphs, `-` lists, headings (###), **bold**, *italic* / _italic_, `code`.
 * Input is HTML-escaped first, so content can never inject markup.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function inlineMarkdown(text: string): string {
	return escapeHtml(text)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/(^|[\s(>])\*([^*\n]+)\*/g, '$1<em>$2</em>')
		.replace(/(^|[\s(>])_([^_\n]+)_/g, '$1<em>$2</em>')
		.replace(/→/g, '<span aria-label="becomes">→</span>');
}

export function markdown(text: string): string {
	const blocks: string[] = [];
	let list: string[] | null = null;
	let paragraphOpen = false;
	const flushList = (): void => {
		if (list) blocks.push(`<ul>${list.map((li) => `<li>${li}</li>`).join('')}</ul>`);
		list = null;
	};
	for (const rawLine of text.split('\n')) {
		const line = rawLine.trimEnd();
		const item = /^\s*[-*]\s+(.*)$/.exec(line);
		if (item) {
			paragraphOpen = false;
			(list ??= []).push(inlineMarkdown(item[1] ?? ''));
			continue;
		}
		flushList();
		if (!line.trim()) {
			paragraphOpen = false;
			continue;
		}
		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			const level = Math.min(heading[1]!.length + 2, 6);
			blocks.push(`<h${level}>${inlineMarkdown(heading[2] ?? '')}</h${level}>`);
			paragraphOpen = false;
			continue;
		}
		if (paragraphOpen) {
			blocks[blocks.length - 1] =
				`${blocks[blocks.length - 1]!.slice(0, -4)} ${inlineMarkdown(line)}</p>`;
		} else {
			blocks.push(`<p>${inlineMarkdown(line)}</p>`);
			paragraphOpen = true;
		}
	}
	flushList();
	return blocks.join('\n');
}
