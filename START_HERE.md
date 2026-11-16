# START HERE — how AJ runs this with Claude Code

This folder is a complete brief. Claude Code reads `CLAUDE.md` automatically and everything else from `docs/`. You only start it, test on your phone, and say what to fix.

## Once (10 minutes)

1. Open Terminal and check your tools:
   ```bash
   claude --version; node -v; pnpm -v; git --version; gh --version
   ```
   Install whatever says "command not found":
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash      # Claude Code (then open a new Terminal window)
   brew install node pnpm gh                           # Node, pnpm, GitHub CLI
   gh auth login                                       # once; lets Claude create the repo and deploy
   ```
2. Set up the project folder (installs the slash commands and the permission rules):
   ```bash
   cd ~/projects/grammatik-gym
   mkdir -p .claude && mv setup/claude-commands .claude/commands && mv setup/settings.json .claude/settings.json && rmdir setup
   ```
   `.claude/settings.json` lets Claude run `pnpm`, `git`, `node` and edit files without asking you each time; it still asks before creating the GitHub repo or using `brew`, and can't use `sudo` or force-push.
3. Start it, keeping the Mac awake while it works (plug in the charger):
   ```bash
   caffeinate -i claude
   ```
   When it asks whether you trust this folder, say yes. Type `/model` and pick **Fable** (if it isn't listed, pick Opus).
4. Paste the kickoff prompt below.

## Kickoff prompt (paste once)

```
You are the lead engineer of Grammatik Gym. Read CLAUDE.md, then every file in docs/ (PRODUCT_SPEC, ARCHITECTURE, CURRICULUM, CONTENT_GUIDE, ROADMAP, PROGRESS, adr/).

Then build Phase 0 and Phase 1 of docs/ROADMAP.md completely, following the working protocol in CLAUDE.md: small commits, tests with the code, `pnpm verify` green before every tick, docs and ADRs updated as you go. Make sensible decisions yourself and record them; ask me only for what CLAUDE.md §7 lists (e.g. before creating the GitHub repo).

German correctness is the top priority for content: list every correct variant, run the blind-solve check, and flag rather than guess.

Stop at the 🛑 at the end of Phase 1 and give me: the deployed URL, how to install it on my phone, and what to test.
```

**Starting it before bed?** Add this line at the end of the kickoff prompt:

```
I'm going to sleep now: use away mode (CLAUDE.md §7). Don't wait for me; leave anything that needs me under "Needs AJ" in PROGRESS and keep going.
```

## Every next time

| You want                     | Type                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Continue with the next phase | `/next`                                                                                                                            |
| Continue, but with a wish    | `/next make the feedback panel bigger on the phone`                                                                                |
| Something is broken or wrong | `/bug the ending builder accepts "neue" for "ein neues Auto"`                                                                      |
| More content                 | `/content B1` or `/content two-way-prepositions`                                                                                   |
| Exercises from your book     | drag page photos into the terminal, then `/book Grammatik aktiv B2-C1, Kapitel 12, Ü1–Ü4, variant` (or `exact`, `remix`)           |
| A new feature or idea        | `/feature add a "Konjunktiv II only" practice mode` (writes it into the spec + roadmap; add "build it now" to build it right away) |
| Quality check                | `/review`                                                                                                                          |
| Session got long / slow      | `/clear`, then `/next` (PROGRESS.md carries the state)                                                                             |

## Run it non-stop instead?

Possible, because every phase ends with a PROGRESS entry. Paste:

```
/next Work through Phases 1 to 3 without stopping at the 🛑 markers, unless you are blocked. Deploy at each phase end and write the PROGRESS entry each time.
```

Recommended anyway: stop after each phase and _use_ it for a day. Your feedback ("this explanation confused me", "this item has two right answers") is worth more than another 2,000 lines of code.

## Try it on your phone

- **Deployed:** open the GitHub Pages URL from PROGRESS.md → iPhone: Safari → Share → _Add to Home Screen_; Android: Chrome → ⋮ → _Install app_.
- **While developing:** Claude can run `pnpm dev --host`; open the shown network URL on the phone (same Wi-Fi).

## Ground rules (from your mentor)

- Supervising Claude is a light-slot task (evening, after the shift). It never takes the 04:30 engineering block or the P-project of the day.
- This vibe-coded version is your **personal tool**. Your portfolio project **E9 Grammatik Gym** (April 2027) stays the version _you_ build (or the parts you rebuild by hand: e.g. the FastAPI sync backend and the LLM generation pipeline). Decide in the March weekly review what E9 becomes.

## Updates and new features later

The project is built to keep growing: every idea goes through `/feature` (written into the spec and roadmap first), every release has a version and a CHANGELOG entry, your progress survives every update (database migrations tested against old backups, IDs that never change), and the phone picks up new versions by itself ("New version — reload"). Details: CLAUDE.md §9. Export a backup in Settings now and then anyway.
