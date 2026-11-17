/**
 * pickFun (THEME_AND_FUN.md §2): chooses a line or meme for an app event.
 *  - nothing at chaos level "off";
 *  - at "some": milestones always, plus at most `extrasPerSession` (1) other events per session;
 *  - at "maximum": every event;
 *  - avoids anything among the last `recentWindow` (20) picks; if every candidate was seen
 *    recently, takes the least recently seen one instead of going silent;
 *  - AJ's own entries are twice as likely as Claude's.
 */
import type { Rng } from '../util/rng';
import { MILESTONES, type FunContent, type FunTrigger } from './schema';

export type ChaosLevel = 'off' | 'some' | 'maximum';
export const CHAOS_LEVELS: readonly ChaosLevel[] = ['off', 'some', 'maximum'];

export type FunPick =
	| {
			kind: 'message';
			id: string;
			text: string;
			mood?: string;
			meme?: { file: string; alt: string };
	  }
	| { kind: 'meme'; id: string; file: string; alt: string };

export interface PickOptions {
	chaos: ChaosLevel;
	/** Ids of earlier picks, oldest first. */
	seen: readonly string[];
	/** Extras (non-milestones) already shown in this session. */
	extrasShown: number;
	rng: Rng;
	recentWindow?: number;
	extrasPerSession?: number;
}

export function isMilestone(event: FunTrigger): boolean {
	return MILESTONES.includes(event);
}

export function pickFun(
	event: FunTrigger,
	content: FunContent,
	options: PickOptions
): FunPick | undefined {
	if (options.chaos === 'off') return undefined;
	if (
		options.chaos === 'some' &&
		!isMilestone(event) &&
		options.extrasShown >= (options.extrasPerSession ?? 1)
	) {
		return undefined;
	}
	const memesById = new Map(content.memes.map((m) => [m.id, m]));
	type Candidate = { pick: FunPick; by: 'aj' | 'claude' };
	const candidates: Candidate[] = [
		...content.messages
			.filter((m) => m.triggers.includes(event))
			.map((m): Candidate => {
				const meme = m.meme ? memesById.get(m.meme) : undefined;
				return {
					by: m.by,
					pick: {
						kind: 'message',
						id: m.id,
						text: m.text,
						mood: m.mood,
						meme: meme && { file: meme.file, alt: meme.alt }
					}
				};
			}),
		...content.memes
			.filter((m) => m.triggers.includes(event))
			.map((m): Candidate => ({
				by: m.by,
				pick: { kind: 'meme', id: m.id, file: m.file, alt: m.alt }
			}))
	];
	if (!candidates.length) return undefined;

	const recent = new Set(options.seen.slice(-(options.recentWindow ?? 20)));
	const fresh = candidates.filter((c) => !recent.has(c.pick.id));
	if (!fresh.length) return leastRecentlySeen(candidates, options.seen).pick;

	const weight = (c: Candidate): number => (c.by === 'aj' ? 2 : 1);
	const total = fresh.reduce((sum, c) => sum + weight(c), 0);
	let roll = options.rng() * total;
	for (const c of fresh) {
		roll -= weight(c);
		if (roll < 0) return c.pick;
	}
	return fresh[fresh.length - 1]!.pick;
}

function leastRecentlySeen<T extends { pick: FunPick }>(
	candidates: T[],
	seen: readonly string[]
): T {
	const lastSeen = (id: string): number => seen.lastIndexOf(id);
	return candidates.reduce((best, c) => (lastSeen(c.pick.id) < lastSeen(best.pick.id) ? c : best));
}

/** Studying after 22:00 (or before 5:00) is "late night". */
export function isLateNight(date: Date): boolean {
	const hour = date.getHours();
	return hour >= 22 || hour < 5;
}

/** True when the last `n` verdicts are all wrong. */
export function endsWithWrongStreak(verdicts: readonly string[], n = 3): boolean {
	return verdicts.length >= n && verdicts.slice(-n).every((v) => v === 'wrong');
}

/** Events for the end of a session, most specific first. */
export function sessionEndEvents(
	verdicts: readonly string[],
	now: Date,
	isFirstSession: boolean
): FunTrigger[] {
	const events: FunTrigger[] = [];
	if (isFirstSession) events.push('first-session');
	if (verdicts.length && verdicts.every((v) => v !== 'wrong')) events.push('perfect-session');
	if (isLateNight(now)) events.push('late-night');
	events.push('session-done');
	return events;
}
