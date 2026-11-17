AJ wants to add fun to the app: $ARGUMENTS
(a sarcastic/motivational line, and/or an image file path, plus when it should appear).

Follow docs/THEME_AND_FUN.md:

1. Text → add an entry to `content/fun/messages.yaml` with `by: aj`, today's date, a fitting `mood`, and triggers matching what AJ said (map his words to the trigger list; ask only if it's truly unclear). Keep his wording exactly, only fix obvious typos.
2. Image → copy it into `static/fun/memes/` with a kebab-case name, add an entry to `content/fun/memes.yaml` with `alt` text and triggers; if AJ also gave text, link them (`meme: <id>` on the message).
3. `pnpm content:validate`, commit `fun: <short description>`, and tell AJ in one line when he'll see it.
