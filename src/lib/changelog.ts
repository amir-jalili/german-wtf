/**
 * Reads the newest release section from CHANGELOG.md (imported as raw text at build time)
 * so Settings can show an in-app "What's new" line (CLAUDE.md §9) from one source of truth.
 */
export interface ReleaseNotes {
	version: string;
	date?: string;
	/** Bullet lines, without the leading "- " and without Markdown emphasis. */
	lines: string[];
}

const HEADING = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?/;

/** Parses the first released (non-"Unreleased") section; `undefined` if there is none. */
export function latestRelease(markdown: string): ReleaseNotes | undefined {
	const lines = markdown.split('\n');
	let current: ReleaseNotes | undefined;
	for (const line of lines) {
		const heading = HEADING.exec(line);
		if (heading) {
			if (current) break;
			const version = heading[1] ?? '';
			if (version.toLowerCase() === 'unreleased') continue;
			current = { version, date: heading[2], lines: [] };
			continue;
		}
		if (current && line.startsWith('- ')) {
			current.lines.push(line.slice(2).replace(/[*_`]/g, '').trim());
		}
	}
	return current;
}
