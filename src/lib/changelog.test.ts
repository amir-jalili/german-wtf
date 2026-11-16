import { describe, expect, it } from 'vitest';
import { latestRelease } from './changelog';

const sample = `# Changelog

## [Unreleased]
### Added
- Not yet shipped

## [0.2.0] - 2026-12-01
### Added
- **Scheduler** with FSRS
- Grammar map
### Fixed
- Umlaut bar on iOS

## [0.1.0] - 2026-11-17
### Added
- First release
`;

describe('latestRelease', () => {
	it('returns the newest released section, skipping Unreleased', () => {
		const release = latestRelease(sample);
		expect(release?.version).toBe('0.2.0');
		expect(release?.date).toBe('2026-12-01');
		expect(release?.lines).toEqual(['Scheduler with FSRS', 'Grammar map', 'Umlaut bar on iOS']);
	});

	it('returns undefined when nothing has been released', () => {
		expect(latestRelease('# Changelog\n\n## [Unreleased]\n- x\n')).toBeUndefined();
	});
});
