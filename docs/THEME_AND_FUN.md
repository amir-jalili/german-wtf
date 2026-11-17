# Theme and Fun — the cat app

AJ's request (17 Nov 2026): the app should feel like *him* — a **cat and cat-meme theme**, with memes and **sarcastic motivational lines** about how hard German is, so anyone who knows him recognises his personality. This file is the source of truth for the look and the fun system. It overrides the "calm, no confetti" line in PRODUCT_SPEC §6.

## 1. Look and feel

- **Mascot: a cat named Dativ** (AJ may rename it; keep the name in one place, `src/lib/ui/fun/mascot.ts`). Dativ is a slightly chubby, deadpan cat who has seen too many adjective endings. Original drawings only, made by Claude as inline SVG components, one per mood:
  - `smug` (correct answer streaks) · `loaf` (idle, Today screen) · `sleeping` (nothing due) · `flat-on-keyboard` (wrong-answer streak) · `crying-thumbs-up` (sarcastic praise; original drawing in the spirit of AJ's favourite meme) · `knocking-things-off-table` (leech / mistake card) · `box` (empty states) · `zoomies` (level complete) · `judging` (late-night study).
- **Palette:** warm and cozy, still WCAG AA: cream/oat background, ink text, **ginger-orange** accent (replaces the purple), soft grey-blue secondary; dark mode = "night cat" (charcoal, amber eyes accent). The case colours N/A/D/G stay distinct from the accent and keep their letter badges.
- **Details:** paw prints as progress dots and streak marks; a cat-tail loading spinner; ears on the bottom-nav active tab; whisker dividers; a cat-face favicon and PWA icon (original). Typography stays clean and readable; the cat is in the details, not in the reading text.
- **Fun never hides learning.** Feedback, explanations and the checker result always come first and in full. Fun appears next to them, never instead of them.

## 2. The fun system

### Content (data, like grammar content)
```
content/fun/
├── messages.yaml     # sarcastic/motivational lines with triggers
└── memes.yaml        # metadata for meme images
static/fun/memes/     # the image files (AJ's own uploads)
```

**messages.yaml** line:
```yaml
- id: aj-1000-years
  text: "Great job, you are really learning German grammar very well. You just have to do it for 1000 more years :))"
  triggers: [point-mastered, level-complete]
  mood: crying-thumbs-up        # mascot pose shown with it (or a meme id: meme: crying-cat)
  lang: en                       # en | de
  by: aj                         # aj | claude
  added: 2026-11-17
```

**memes.yaml** entry:
```yaml
- id: crying-cat
  file: crying-cat-thumbs-up.jpg   # in static/fun/memes/
  alt: "A cat with teary eyes giving a thumbs up"
  triggers: [point-mastered, session-done]
  by: aj
```

### Triggers (events the app emits)
`first-session` · `session-done` · `perfect-session` · `point-learned` · `point-mastered` · `level-complete` · `wrong-streak-3` · `near-miss` · `leech` · `mistake-resolved` · `streak-7` · `streak-30` · `comeback` (back after ≥ 2 days) · `late-night` (studying after 22:00 — the cat tells him to sleep) · `nothing-due` · `app-update` · `error-page`.

### Rules
- `pickFun(event, seenHistory, settings, rng)` lives in `src/lib/engine/fun/` (pure, unit-tested): picks a matching message/meme, avoids anything shown in the last 20 picks, prefers AJ's own lines 2:1, returns nothing when the frequency budget is used up.
- **Frequency setting "Cat chaos level"** in Settings: `off` (serious mode, for focus) · `some` (default: milestones always, plus at most 1 extra per session) · `maximum` (every event).
- Where it shows: end-of-session screen, milestone toast, empty states, loading, 404/error page, the Today screen's mascot speech bubble. Never in the middle of answering an item, except a tiny mascot pose change.
- Seen-history in Dexie (`funSeen` table — needs a migration like any schema change).
- Animations respect `prefers-reduced-motion`.

### Adding fun
- **AJ adds** a line or a meme any time: type `/meme <text or image path> <when to show it>` in Claude Code (or edit the YAML yourself). Images: drop the file into `static/fun/memes/`.
- **Claude adds** fun on its own: when finishing a feature or a content batch, if something genuinely funny comes up, add 1–3 lines to `messages.yaml` with `by: claude`. Keep them affectionate: the joke is always that *German* is hard, never that AJ is bad. Mix EN and DE (DE lines are free reading practice).
- **Images:** Claude never downloads meme pictures or other images from the web. Meme images come only from AJ; Claude contributes text and its own original SVG drawings. Every meme gets `alt` text.
- `pnpm content:validate` also validates `content/fun/` (schema, unique ids, known triggers, files exist).
