# Changelog

All notable changes to German WTF. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions: [SemVer](https://semver.org/). The newest released section is shown in the app under Settings → "What's new".

## [Unreleased]

## [0.3.0] - 2026-11-18

### Added

- Today: one Start button runs the day's mix (reviews that are due, mistakes to fix, then a new grammar point), with a summary of what came back, what got stronger and which mistakes are fixed.
- Spaced repetition (FSRS): every answer you've ever given, including those from 0.2, schedules the next review. Wrong answers become mistake cards that come back until they're fixed.
- Your books: import a book pack in Settings → My books; the Map gets a "My books" tab with mastery per chapter, and Today offers "Practise chapter X".
- Map with all A1–C2 points (mastery, due counts, "learn first" hints, search that ignores umlauts) and Stats (12-week heatmap, optional streak, 7-day forecast, mastery per level, accuracy per topic, weakest points).
- Settings: minutes and new points per day, how much to remember, typing or choosing, theme, German voice and speed, English or German interface, backup import that always asks first.

### Fixed

- The session summary no longer appears before the last answer is saved, and a setting changed while the app is still loading is no longer overwritten.

## [0.2.1] - 2026-11-17

### Fixed

- On iPhone the bottom bar no longer hides the end of a page: the lesson's "Practise" button is fully visible again.

## [0.2.0] - 2026-11-17

### Changed

- Renamed the app from *Grammatik Gym* to **German WTF**, tagline "Was zur Katze?!". New address: amir-jalili.github.io/german-wtf. Your progress stays on your phone.

### Added

- Cat theme: Dativ the cat in 7 moods, ginger and cream colours, night-cat dark mode, paw-print progress.
- Six grammar points with lessons and 112 checked exercises: Akkusativ, Dativ, Wechselpräpositionen, adjective endings after der/die/das, weil/dass, Perfekt with sein.
- Practice: 10 mixed exercises per point with instant feedback; every answer is saved on your phone; backup export in Settings.
- Grammar map (first version): the six ready points by level.
- Fun system: Dativ comments on near-misses, wrong streaks and the end of a session. "Cat chaos level" in Settings: off, some, maximum.

## [0.1.0] - 2026-11-17

### Added

- Project brief: spec, architecture, A1–C2 curriculum (162 points), content guide, roadmap, ADRs.
- App shell: Today · Map · Mistakes · Stats · Settings, dark mode, case colours with N/A/D/G badges, error panel with "copy debug info".
- Installable offline PWA with "New version — reload" toast.
- Version and "What's new" in Settings; feature flags.
