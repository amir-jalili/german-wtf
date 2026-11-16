# Content Guide — writing grammar points and items

Content is the product. A wrong item teaches a wrong rule, so every item passes the gates in §6 before it is served.

## 1. Content from AJ's books

AJ studies with grammar books (e.g. _Grammatik aktiv_ A1–B1 and B2–C1, _A/B/C Grammatik_, _Sicher B2/C1_). Their exercises can be the base for items. AJ gives the book, chapter and exercise (typed, or photos of the page) and the mode:

| Mode                  | What Claude writes                                                                                                                                                                                                            | Example                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `variant` _(default)_ | Same sentence structure and the **same grammar target**, other words: swap nouns, verbs, names, places, numbers. Keep what the exercise tests (case, gender, number, tense, construction) identical unless AJ asks otherwise. | Book: _Das ist ein Auto._ → _Das ist ein Mädchen._ (still neuter, still Nominativ) |
| `exact`               | The book's sentence as printed, when AJ asks for it.                                                                                                                                                                          | _Das ist ein Auto._                                                                |
| `remix`               | 2–4 variants per book sentence that deliberately vary gender/case/person, for extra reps.                                                                                                                                     | _Das ist ein Tisch. / Das ist eine Lampe. / Das ist ein Mädchen._                  |

Rules:

- Every book-based item records where it comes from: `origin: { book: "Grammatik aktiv B2-C1", chapter: "12", exercise: "Ü3", mode: variant }` and `source: book-variant | book-exact`. This powers "practise chapter 12" and progress per chapter.
- Book-based items get our own explanation, errorTags and **all** accepted variants, and pass the same quality gates (§6). If AJ provides the book's answer key, check against it; if key and our check disagree, flag.
- They live in `content/books/` (a separate **private** Git repo, see ARCHITECTURE §8) and reach the phone as an imported _book pack_. They never go into the main repo or the public site: the app is deployed on a public URL, and a publisher could get the whole site taken down if its exercises appeared there.
- The main (public) content is written by us; it may follow the books' topic order and terminology.
- Open data: Tatoeba (CC BY 2.0 FR), Wiktionary via kaikki.org (CC BY-SA) — record attribution in `content/SOURCES.md`.

## 2. Writing style

- **Rules in our own words**, EN by default, short, with the _why_ when it helps memory ("Dativ plural adds -n: _mit den Kindern_").
- **Sentences**: natural, adult, useful — studies, work, flat hunting, the Ausländerbehörde, doctor's visits, travel by train, cooking, friends, news. Vary names (Lena, Murat, Yuki, Amir, Sophie, Kofi, Jonas, Ana …). No stereotypes, no politics-baiting, no brand names.
- **Level-appropriate**: A1 ≤ 8 words, A2 ≤ 12, B1 ≤ 16, B2 ≤ 20, C1/C2 any length but readable on a phone. Vocabulary roughly at or below the level; one unknown word max, glossed in `prompt`.
- **One target per item**: the gap tests the grammar point, not vocabulary. Give the lemma in brackets when the word isn't inferable: `(alt)`, `(gehen, Perfekt)`.
- **Explanation**: 1–2 lines, names the rule applied _in this item_.
- **Standard German (Germany)**; new spelling rules (2006+).

## 3. Grammar point file

`content/points/<family>/<point-id>.yaml`

```yaml
id: adj-endings-definite
title:
  {
    en: 'Adjective endings after the definite article',
    de: 'Adjektivdeklination nach bestimmtem Artikel'
  }
level: A2
family: adjectives
prerequisites: [dative-articles]
compareWith: [adj-endings-indefinite]
version: 1
lesson:
  summary: 'After der/die/das the article already shows the case, so the adjective only takes -e or -en.'
  rule: |
    After the definite article (and dies-, jen-, jed-, welch-, all-), adjectives take the **weak** endings:
    - **-e** in the five "easy" spots: Nominativ singular (all genders) and Akkusativ singular feminine and neuter.
    - **-en** everywhere else: all Dativ, all Genitiv, all plural, and Akkusativ masculine.
  table:
    columns: [m, f, n, pl]
    rows:
      nom: ['der alte Mann', 'die alte Frau', 'das alte Haus', 'die alten Häuser']
      akk: ['den alten Mann', 'die alte Frau', 'das alte Haus', 'die alten Häuser']
      dat: ['dem alten Mann', 'der alten Frau', 'dem alten Haus', 'den alten Häusern']
      gen: ['des alten Mannes', 'der alten Frau', 'des alten Hauses', 'der alten Häuser']
  examples:
    - de: 'Ich helfe dem alten Mann.'
      en: "I'm helping the old man."
      xray: [{ text: 'dem alten Mann', role: dat-obj, case: dat, gender: m }]
    - de: 'Die neue Wohnung ist hell.'
      en: 'The new flat is bright.'
      xray: [{ text: 'Die neue Wohnung', role: subj, case: nom, gender: f }]
  pitfalls:
    - 'Akkusativ masculine is -en, not -e: *den neuen Tisch*.'
items:
  - id: adj-endings-definite/001
    type: cloze
    level: A2
    skill: form
    text: 'Ich helfe dem {{alten}} Mann.'
    hint: '(alt)'
    accepted: ['alten']
    explanation: 'Dativ after the definite article → always -en.'
    errorTags: [adj-ending]
    distractorNotes:
      alte: '-e only in Nom. singular and Akk. singular f/n. Here *helfen* takes the Dativ → -en.'
    review: { status: verified, by: claude-blind-solve, date: 2026-11-17 }
    source: original
generators:
  - id: adj-ending
    params: { article: definite, cases: [nom, akk, dat], count: 60 }
```

## 4. Item types (schemas live in `src/lib/engine/content/`)

All items share: `id, type, level, skill, explanation, errorTags, review, source`, optional `prompt, hint, distractorNotes, audio`.

**cloze** — typed gap(s). Gaps are `{{answer}}` in `text`; the first listed answer in `accepted` per gap is canonical. One gap → `accepted` is a flat list; multiple gaps → a list of lists (one list per gap). The validator normalises both shapes.

```yaml
type: cloze
text: 'Gestern {{bin}} ich mit dem Zug nach Berlin {{gefahren}}.'
hint: '(fahren, Perfekt)'
accepted: [['bin'], ['gefahren']]
errorTags: [aux-haben-sein, participle]
```

**choice** — pick one; use for first exposure and contrasts.

```yaml
type: choice
text: 'Wir wohnen in ___ Stadt.'
options: ['der', 'die', 'dem', 'den']
answer: 'der'
explanation: 'Wo? → Wechselpräposition + Dativ; *die Stadt* (f) → *der*.'
errorTags: [preposition-case]
```

**transform** — rewrite a sentence; list every correct output.

```yaml
type: transform
prompt: 'Passiv Präsens'
from: 'Man repariert das Auto.'
accepted: ['Das Auto wird repariert.']
errorTags: [voice, verb-final]
```

**order** — sentence builder with tiles; `fields` maps the canonical answer onto the Feldermodell for the visualiser.

```yaml
type: order
prefix: 'Ich komme heute nicht, '
tiles: ['weil', 'ich', 'morgen', 'arbeiten', 'muss']
accepted: ['weil ich morgen arbeiten muss']
fields: { connector: 'weil', mittelfeld: 'ich morgen', rightBracket: 'arbeiten muss' }
errorTags: [verb-final]
```

**combine** — join two sentences with a given connector.

```yaml
type: combine
parts: ['Es regnet.', 'Wir gehen spazieren.']
connector: 'trotzdem'
accepted:
  - 'Es regnet, trotzdem gehen wir spazieren.'
  - 'Es regnet. Trotzdem gehen wir spazieren.'
  - 'Es regnet, wir gehen trotzdem spazieren.'
errorTags: [v2-position, connector-choice]
```

**errorHunt** — tap the wrong part, then type the fix.

```yaml
type: errorHunt
text: 'Wegen dem Regen bleiben wir zu Hause.'
errorSpan: 'dem Regen'
accepted: ['des Regens']
explanation: '*wegen* takes the Genitiv in written German: *des Regens* (masculine Genitiv adds -s).'
errorTags: [preposition-case, noun-ending]
```

**endingBuilder** — scaffolded steps, fades with mastery (UI hides steps when the card is Familiar+).

```yaml
type: endingBuilder
text: 'Das ist ein {{neues}} Auto.'
hint: '(neu)'
steps:
  - { ask: 'Article type?', options: [definite, indefinite, none], answer: indefinite }
  - { ask: 'Case?', options: [nom, akk, dat, gen], answer: nom }
  - { ask: 'Gender/number?', options: [m, f, n, pl], answer: n }
accepted: ['neues']
errorTags: [adj-ending]
```

**paradigm** — fill a small table.

```yaml
type: paradigm
prompt: 'Konjunktiv II of *kommen*'
cells:
  - { label: 'ich', accepted: ['käme'] }
  - { label: 'du', accepted: ['kämest', 'kämst'] }
  - { label: 'er/sie/es', accepted: ['käme'] }
  - { label: 'wir', accepted: ['kämen'] }
  - { label: 'ihr', accepted: ['kämet', 'kämt'] }
  - { label: 'sie/Sie', accepted: ['kämen'] }
errorTags: [mood, verb-stem]
```

**match** — pair left and right.

```yaml
type: match
pairs:
  - ['warten', 'auf + Akk']
  - ['sich interessieren', 'für + Akk']
  - ['träumen', 'von + Dat']
  - ['teilnehmen', 'an + Dat']
errorTags: [preposition-choice]
```

**classify** — sort into buckets.

```yaml
type: classify
buckets: ['Wo? (Dativ)', 'Wohin? (Akkusativ)']
entries:
  - { text: 'Ich lege das Buch auf den Tisch.', bucket: 1 }
  - { text: 'Das Buch liegt auf dem Tisch.', bucket: 0 }
errorTags: [preposition-case]
```

**dictation** — hear (TTS), type the whole sentence; checks with the standard checker per token.

```yaml
type: dictation
text: 'Ich habe mir die Hände gewaschen.'
errorTags: [reflexive, participle]
```

## 5. Quantity targets

| Point type                                       | Hand-written items             | Plus           |
| ------------------------------------------------ | ------------------------------ | -------------- |
| Closed paradigm (articles, endings, conjugation) | ≥ 15 (mixed types, in context) | generator ≥ 60 |
| Syntax / connectors / clauses                    | ≥ 25                           | —              |
| Style (C1/C2)                                    | ≥ 20 transform/combine         | —              |
| Contrast drill                                   | ≥ 20                           | —              |

Each point: at least 3 different item types; ≥ 30 % typed production.

## 6. Quality gates (an item is served only when all pass)

1. **Schema** (`pnpm content:validate`): Zod passes; ids unique and stable; prerequisites exist, no cycles; catalogue and CURRICULUM in sync; every gap has ≥ 1 accepted answer; options contain the answer; no duplicate sentences (normalised); sentence length within the level limit.
2. **German check** (`pnpm content:lint-de`): every _correct_ sentence (text with canonical answers filled in) passes LanguageTool (public API or self-hosted; responses cached in `.cache/languagetool/`). A LanguageTool match is a warning to investigate, not an automatic failure — record the decision in `review.note`.
3. **Blind solve** (Claude procedure): in a fresh context (a subagent or `/clear`), give the batch **without answers** and solve every item. If the blind answer ≠ key:
   - blind answer also correct → add it to `accepted`;
   - ambiguous prompt → rewrite the item (more context, a hint) or set `flagged`;
   - key wrong → fix the key.
     Then set `review: { status: verified, by: claude-blind-solve, date }`.
4. **AJ's review queue (optional)**: in-app dev page `/dev/review` lists items by status; AJ can flag an item from any session ("Report this item"), which sets a local flag and shows it in the queue for the next `/content` pass.

`flagged` and `draft` items are never served in production builds.

## 7. Batch workflow for `/content`

1. Read the point in CURRICULUM.md and its prerequisites' lessons (stay consistent in terminology).
2. Write/extend the lesson (rule, table, 3–5 x-rayed examples, pitfalls).
3. Write items in batches of 10–15, mixing types; status `draft`.
4. Run gates 1 and 2; fix.
5. Run gate 3 (blind solve); fix; mark verified.
6. `pnpm content:stats` and update the coverage table at the end of PROGRESS.md.
7. Commit: `content(<point-id>): lesson + 25 items`.
