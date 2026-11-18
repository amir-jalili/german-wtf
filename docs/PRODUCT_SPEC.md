# Product Spec — German WTF

## 1. Vision

**Name:** *German WTF* — tagline **"Was zur Katze?!"** (a pun on *Was zur Hölle?!*; name chosen 17 Nov 2026, ADR 0006). The tagline sits under the mascot on the Today screen and in the install description; the home-screen icon is labelled *German WTF*.

The app in which a motivated adult can **master German grammar from A1 to C2** in 15 minutes a day: learn a rule, use it actively, get told exactly _why_ an answer is wrong, and see every grammar point and every personal mistake come back exactly when it's about to be forgotten. Phone first, works offline, no ads, no noise.

**First user:** AJ (B2 → C1 by June 2027, studies with grammar books, uses Anki daily, keeps notes in Obsidian). If AJ doesn't open it every day, the product has failed, whatever the feature count.

## 2. Principles (from learning science)

1. **Production over recognition.** Default to typed answers (active recall). Multiple choice only for first exposure, contrast decisions and very new learners.
2. **Spacing.** Every grammar point is scheduled with FSRS; each review shows a _fresh_ sentence, so you learn the rule, not the sentence.
3. **Interleaving.** Daily sessions mix grammar points; contrast drills put confusable points side by side (_als/wenn_, _seit/seitdem_, Konjunktiv I/II).
4. **Feedback that teaches.** Every wrong answer gets a diagnosis (which feature was wrong: case, gender, ending, word order…) and the one rule to remember. Near-misses (typo, missing umlaut, capitalisation) are flagged as "almost", not punished.
5. **Scaffolding then fading.** Hard paradigms (adjective endings, case after prepositions) start with a step-by-step builder, and the steps disappear as mastery grows.
6. **Desirable difficulty, low friction.** Sessions start in one tap, run without page loads, and end with a clear "done for today".
7. **Your mistakes are content.** A mistake becomes its own review card and appears in a mistake journal you can export.

## 3. Benchmark — what the best tools do, and where we go further

| Tool                                                     | What it does well (we adopt)                                                                                                                                            | Gap we close                                                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Bunpro** (Japanese, the gold standard for grammar SRS) | Typed recall; SRS per grammar point with a new sentence each review; ~900 grammar points with hand-written explanations; self-study sentences; related grammar; offline | Nuance between similar points needs manual digging → our **contrast drills** and "compare with" panels |
| **Clozemaster**                                          | Huge volume of cloze sentences; grammar challenges; "Explain" on wrong answers; custom collections                                                                      | Little structure or rule teaching → our **curriculum map + lessons**                                   |
| **KasusKnacker / German grammar drill apps**             | Focus on cases, endings, prepositions; explanation per question; error tracking                                                                                         | Stop around B1; shallow diagnosis → **error-type diagnosis + C1/C2**                                   |
| **Sievers Study Hall**                                   | Monumental drill volume, minimal UI, verbs with prepositions                                                                                                            | No SRS, no teaching → **SRS + lessons**                                                                |
| **Busuu / Babbel**                                       | Structured path, review queue, AI speaking                                                                                                                              | Grammar thin above B1 → **full C1/C2 grammar & style**                                                 |
| **Langua (AI)**                                          | Corrections after conversation, generates exercises for weak points                                                                                                     | Unverified AI output → **verified content, AI only as optional tutor**                                 |
| **Lingolia, Schubert-Verlag online exercises**           | Clear free rule pages with tables                                                                                                                                       | Static pages → **interactive, scheduled**                                                              |

**Our edges (the reasons this app should exist):**

1. Complete **A1–C2** catalogue, including C1/C2 style grammar (Nominalstil, Partizipialattribute, Konjunktiv I in news, Funktionsverbgefüge, Modalpartikeln, register) that drill apps skip.
2. **Mistake-type SRS**: your recurring errors (e.g. _wegen + Genitiv_) become cards.
3. **Contrast drills** for every confusable pair.
4. **Scaffolded builders** (adjective-ending decision path, case finder) that fade with mastery.
5. **Visual grammar**: case-colour **X-ray mode** on any sentence, and the **Feldermodell** (Vorfeld · linke Klammer · Mittelfeld · rechte Klammer · Nachfeld) shown on every word-order exercise.
6. **Generated paradigms** (endings, conjugations, articles) from a lexicon: correct by construction, practically infinite.
7. **Verified content**: schema checks, LanguageTool, and a blind-solve review before an item is served.
8. **Obsidian & Anki friendly**: Fehlerliste Markdown export and Anki CSV export.
9. **Your books inside the app**: exercises from your own grammar books, as variants (new words, same grammar) or exactly as printed, sorted by book and chapter, with progress per chapter — in a private book pack, never on the public site.

## 4. Features (MoSCoW)

### Must (v1, AJ uses it daily)

- **Grammar map A1–C2**: all points from `CURRICULUM.md`, grouped by level and family, with prerequisites, mastery colour and due count. Search.
- **Lesson per grammar point**: short rule in own words, a table where useful, 3–5 annotated examples (X-ray colours), common mistakes, "compare with" links, then a guided mini-practice (3 scaffolded items → 5 free items).
- **Exercise types** (see `CONTENT_GUIDE.md` for schemas): cloze (typed), choice, transform, sentence builder (word tiles), combine with connector, error hunt, ending builder, paradigm table, match, classify, dictation (TTS).
- **Checker**: accepts all listed variants; tolerant normalisation (whitespace, quotes, `ae/oe/ue` → umlaut only as a near-miss hint, `ss/ß`), near-miss detection (Levenshtein 1 on letters, capitalisation, umlaut), diagnosis by error tag, explanation from the item or rule.
- **SRS (FSRS)** per grammar point × skill, fresh item each review; mistake cards per error tag; leech detection (≥ 6 lapses → suggest the lesson again).
- **Daily session**: one tap; target 10/15/25 min; order: due reviews → mistake cards → new points (setting: 0–3/day); interleaved; end screen with summary and "what came back today".
- **Your progress, always visible** (Stats + Today + Map): due today, streak (optional, off-able), 12-week heatmap, items answered and accuracy per day/week, accuracy per family, mastery per level (A1…C2 progress bars) and per grammar point (colour on the Map), weakest 5 points, mistakes resolved, forecast of reviews for 7 days, and progress per book chapter.
- **My books**: book packs (see CONTENT_GUIDE §1) — practise a chapter in one tap, see mastery per chapter. Built: Settings → _My books_ imports a pack; the Map gets a _My books_ tab (book → chapter → mastery and answered items); Today offers the first chapter that isn't answered through or strong yet. A chapter's mastery is the weakest card its items review, and chapter answers count like any review (they update the point's cards).
- **Umlaut helper**: ä ö ü ß buttons above the keyboard; desktop shortcuts.
- **Audio**: every sentence playable with the browser's German TTS (rate setting).
- **Offline PWA**: installable on iOS/Android/desktop; full use offline.
- **Backup**: export/import all progress as JSON.
- **Settings**: daily target, new points per day, typed vs choice preference, streak on/off, theme, TTS voice/speed, UI language (EN/DE).

### Should (v1.x)

- **Placement test** (adaptive, ~30 items, 10 min) that marks points as "probably known" (scheduled with long intervals, verified by later reviews) instead of skipping them.
- **Contrast drills** for every pair listed in CURRICULUM.md.
- **Style trainers (C1/C2)**: Verbalstil ↔ Nominalstil, relative clause ↔ Partizipialattribut, direct ↔ indirect speech (Konjunktiv I), active ↔ passive ↔ Passiversatz.
- **Exam-style mixed sets** per level (Goethe/telc _style_, our own items, no exam content, no trademark claims).
- **Fehlerliste export**: Markdown lines in AJ's Obsidian format:
  `- 2026-11-13 · German WTF · ~~wegen dem Regen~~ → wegen des Regens · wegen + Genitiv`
- **Anki CSV export** of mistake cards (front: wrong sentence, back: correction + rule).
- **Self-study sentences** (like Bunpro): paste a sentence from your reading, mark the gap, attach to a grammar point; it joins your reviews.
- **Bookmarks** and "practise this point now" (cram, doesn't disturb SRS).

- **Fun system**: memes and sarcastic motivational lines on milestones, session ends, streaks and empty states; AJ adds his own with `/meme`, Claude adds some itself (THEME_AND_FUN.md).

### Could (later)

- **AI tutor (bring your own API key, off by default)**: "explain more" on any item; free-writing tasks per grammar point with feedback focused on that point; generate extra items into a _local review queue_ (never served unreviewed).
- **Speaking mode** with the Web Speech API where supported (say the transformed sentence).
- **Sync across devices** via a small backend (FastAPI + Postgres) — also the bridge to AJ's E9 portfolio version.
- **Reading passages** per level that use recently learned points, with tap-to-X-ray.
- **Austrian/Swiss variants** toggle.

### Won't (now)

Accounts, social features, leaderboards, paid plans, ads, tracking, vocabulary courses (Anki covers vocab), book content on the public site.

## 5. Key flows

1. **Open app** → Today screen: big "Start session (14 reviews · 2 new · ~15 min)" button, below it streak/heatmap and weakest points.
2. **Session item** → prompt → answer → instant check: ✅ (with the full sentence and audio), 🟡 near-miss ("almost: _Grüße_ — check the umlaut"; counts as correct, shown once more at the end), ❌ (your answer with the wrong part highlighted, the correct answer, the diagnosis tag, one-line rule, "open lesson"). Rate is automatic from correctness and time; optional "I guessed" button marks it Hard.
3. **New point** → lesson → guided practice → added to SRS.
4. **Map** → tap point → lesson, stats, examples, "compare with", practise now.
5. **Mistake journal** → list of mistakes by tag and date → export.

## 6. UI and visual design

- Phone first (375 px), one column, thumb-reachable primary actions at the bottom; desktop gets a two-column layout and keyboard shortcuts (Enter = check/continue, 1–4 = choices).
- **Cat theme with personality** (AJ's request): mascot *Dativ*, cat palette, memes and sarcastic motivational lines — full spec in `docs/THEME_AND_FUN.md`, which overrides anything here. Reading text stays clean and high-contrast; animations respect reduced motion.
- **Case colours** (consistent everywhere, also in tables): Nominativ, Akkusativ, Dativ, Genitiv each a distinct colour _plus_ a letter badge (N/A/D/G) for colour-blind users. Gender markers: der/die/das with a small symbol, not only colour.
- **Feldermodell strip** above sentence-builder items: five labelled zones; tiles snap into zones.
- Dark mode from day one.
- UI text English by default with a German UI option (good immersion for B2+). Grammar terms shown bilingually (_Akkusativ / accusative_).

## 7. Success metrics (personal, visible in the dashboard)

- AJ studies ≥ 25 of 30 days after launch.
- Retention (correct on review) 85–92 % — FSRS target retention 0.9.
- Each level's points: ≥ 80 % at "Strong" before AJ's C1 exam.
- Content: ≥ 25 items per point (or a generator), 0 known-wrong items served.
