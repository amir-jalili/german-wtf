/**
 * Numbers for the Stats screen (P2.7). Pure; "days" are local calendar days of the device.
 */
import type { CatalogueEntry } from '../content/schema';
import type { Level } from '../content/levels';
import type { MistakeCard, PointCard } from '../scheduler/cards';
import { MASTERY_LEVELS, type Mastery } from '../scheduler/mastery';
import { pointMastery } from './progress';

type Verdict = 'correct' | 'near-miss' | 'wrong';
export interface StatAnswer {
	pointId: string;
	verdict: Verdict;
	timestamp: number;
}

/** Local midnight of the day containing `t`. */
export function dayStart(t: number | Date): number {
	const d = new Date(t);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

/** Adds whole calendar days (DST-safe). */
export function addDays(day: number, n: number): number {
	const d = new Date(day);
	d.setDate(d.getDate() + n);
	return d.getTime();
}

export interface HeatDay {
	day: number;
	count: number;
}

/**
 * `weeks` × 7 days ending with the week that contains `now`; weeks start on Monday
 * (German calendars). Days after today are included with count 0 so the grid is complete.
 */
export function heatmap(answers: readonly StatAnswer[], now: Date, weeks = 12): HeatDay[] {
	const today = dayStart(now);
	const weekday = (new Date(today).getDay() + 6) % 7; // Monday = 0
	const first = addDays(today, -weekday - (weeks - 1) * 7);
	const counts = new Map<number, number>();
	for (const a of answers) {
		const d = dayStart(a.timestamp);
		if (d >= first) counts.set(d, (counts.get(d) ?? 0) + 1);
	}
	return Array.from({ length: weeks * 7 }, (_, i) => {
		const day = addDays(first, i);
		return { day, count: counts.get(day) ?? 0 };
	});
}

/** Consecutive practice days ending today (or yesterday, if today isn't done yet). */
export function streak(answers: readonly StatAnswer[], now: Date): number {
	const days = new Set(answers.map((a) => dayStart(a.timestamp)));
	let day = dayStart(now);
	if (!days.has(day)) day = addDays(day, -1);
	let count = 0;
	while (days.has(day)) {
		count++;
		day = addDays(day, -1);
	}
	return count;
}

export interface FamilyAccuracy {
	family: string;
	answers: number;
	/** 0–1, near-misses count as correct (PRODUCT_SPEC §5). */
	accuracy: number;
}

export function accuracyByFamily(
	answers: readonly StatAnswer[],
	catalogue: readonly CatalogueEntry[]
): FamilyAccuracy[] {
	const familyOf = new Map(catalogue.map((e) => [e.id, e.family]));
	const totals = new Map<string, { n: number; ok: number }>();
	for (const a of answers) {
		const family = familyOf.get(a.pointId);
		if (!family) continue;
		const t = totals.get(family) ?? { n: 0, ok: 0 };
		t.n++;
		if (a.verdict !== 'wrong') t.ok++;
		totals.set(family, t);
	}
	return [...totals]
		.map(([family, t]) => ({ family, answers: t.n, accuracy: t.ok / t.n }))
		.sort((a, b) => a.accuracy - b.accuracy || b.answers - a.answers);
}

export type MasteryCounts = Record<Mastery, number>;

/** Per level: how many points (with content) are at each mastery level. */
export function masteryByLevel(
	catalogue: readonly (CatalogueEntry & { itemCount: number })[],
	cards: readonly PointCard[]
): Map<Level, MasteryCounts> {
	const mastery = pointMastery(cards);
	const result = new Map<Level, MasteryCounts>();
	for (const e of catalogue) {
		if (e.itemCount <= 0) continue;
		const counts =
			result.get(e.level) ??
			(Object.fromEntries(MASTERY_LEVELS.map((m) => [m, 0])) as MasteryCounts);
		counts[mastery.get(e.id) ?? 'new']++;
		result.set(e.level, counts);
	}
	return result;
}

/** Reviews due on each of the next `days` days; anything overdue counts for today. */
export function forecast(
	cards: readonly PointCard[],
	mistakeCards: readonly MistakeCard[],
	now: Date,
	days = 7
): HeatDay[] {
	const today = dayStart(now);
	const out = Array.from({ length: days }, (_, i) => ({ day: addDays(today, i), count: 0 }));
	const dues = [
		...cards.map((c) => c.fsrs.dueAt),
		...mistakeCards.filter((m) => !m.resolvedAt).map((m) => m.fsrs.dueAt)
	];
	for (const due of dues) {
		const d = Math.max(dayStart(due), today);
		const slot = out.find((x) => x.day === d);
		if (slot) slot.count++;
	}
	return out;
}

export interface WeakPoint {
	pointId: string;
	/** 0–1 estimated recall now (lowest skill card). */
	recall: number;
	lapses: number;
}

/** The `n` started points with the lowest estimated recall right now. */
export function weakest(
	cards: readonly PointCard[],
	retrievability: (card: PointCard) => number,
	n = 5
): WeakPoint[] {
	const byPoint = new Map<string, WeakPoint>();
	for (const c of cards) {
		if (c.fsrs.reps === 0) continue;
		const recall = retrievability(c);
		const prev = byPoint.get(c.pointId);
		if (!prev || recall < prev.recall) {
			byPoint.set(c.pointId, { pointId: c.pointId, recall, lapses: c.fsrs.lapses });
		}
	}
	return [...byPoint.values()]
		.sort((a, b) => a.recall - b.recall || b.lapses - a.lapses)
		.slice(0, n);
}
