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
	// Greedy interleaving: always take the type with the most items left, excluding the
	// previous item's type. This avoids two of the same type in a row whenever that is possible.
	const queues = new Map<string, Item[]>();
	for (const item of pool) {
		const queue = queues.get(item.type) ?? [];
		queue.push(item);
		queues.set(item.type, queue);
	}
	const types = shuffle([...queues.keys()], options.rng); // random tie-break order
	const remaining = (t: string): number => queues.get(t)?.length ?? 0;
	const picked: Item[] = [];
	let lastType: string | undefined;
	while (picked.length < count) {
		const available = types.filter((t) => remaining(t) > 0);
		if (!available.length) break;
		const others = available.filter((t) => t !== lastType);
		const choices = others.length ? others : available;
		const type = choices.reduce((best, t) => (remaining(t) > remaining(best) ? t : best));
		picked.push(queues.get(type)!.shift()!);
		lastType = type;
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
