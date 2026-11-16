/**
 * Practice session for one grammar point (ROADMAP P1.8, no SRS yet): picks up to `count`
 * servable items and interleaves exercise types so no two consecutive items share a type
 * when that is possible.
 */
import type { Item } from '../content/schema';
import { shuffle, type Rng } from '../util/rng';

export interface PracticeOptions {
	count?: number;
	rng: Rng;
}

export function pickPracticeItems(items: readonly Item[], options: PracticeOptions): Item[] {
	const count = options.count ?? 10;
	const pool = shuffle(
		items.filter((i) => !i.retired && i.review.status === 'verified'),
		options.rng
	);
	// Round-robin over types, each queue in random order.
	const queues = new Map<string, Item[]>();
	for (const item of pool)
		(queues.get(item.type) ?? queues.set(item.type, []).get(item.type)!).push(item);
	const types = shuffle([...queues.keys()], options.rng);
	const picked: Item[] = [];
	let lastType: string | undefined;
	while (picked.length < count && types.some((t) => queues.get(t)!.length)) {
		// Prefer a type different from the previous item's.
		const candidates = types.filter((t) => queues.get(t)!.length && t !== lastType);
		const type = candidates[0] ?? types.find((t) => queues.get(t)!.length)!;
		picked.push(queues.get(type)!.shift()!);
		lastType = type;
		types.push(types.splice(types.indexOf(type), 1)[0]!); // rotate
	}
	return picked;
}

export interface PracticeSummary {
	total: number;
	correct: number;
	nearMiss: number;
	wrong: number;
	/** 0–1, near-misses count as correct (PRODUCT_SPEC §5). */
	accuracy: number;
}

export function summarise(
	verdicts: readonly ('correct' | 'near-miss' | 'wrong')[]
): PracticeSummary {
	const correct = verdicts.filter((v) => v === 'correct').length;
	const nearMiss = verdicts.filter((v) => v === 'near-miss').length;
	const wrong = verdicts.filter((v) => v === 'wrong').length;
	const total = verdicts.length;
	return { total, correct, nearMiss, wrong, accuracy: total ? (correct + nearMiss) / total : 0 };
}
