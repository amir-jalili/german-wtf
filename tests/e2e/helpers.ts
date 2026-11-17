/** Shared e2e helpers: answers are looked up in the compiled content bundles. */
import type { Page } from '@playwright/test';

export type Item =
	| { id: string; type: 'cloze'; accepted: string[][] }
	| { id: string; type: 'choice'; options: string[]; answer: string }
	| { id: string; type: 'order'; accepted: string[]; tiles: string[] };

export async function itemsOf(
	page: Page,
	level: string,
	pointId: string
): Promise<Map<string, Item>> {
	const res = await page.request.get(`/content/${level}.json`);
	const bundle = (await res.json()) as { points: { id: string; items: Item[] }[] };
	const point = bundle.points.find((p) => p.id === pointId)!;
	return new Map(point.items.map((i) => [i.id, i]));
}

export type Mode = 'right' | 'almost' | 'wrong';

/** Answers the visible item; returns the verdict the app should show. */
export async function answer(
	page: Page,
	items: Map<string, Item>,
	mode: Mode
): Promise<'correct' | 'near-miss' | 'wrong'> {
	const exercise = page.getByTestId('exercise');
	const item = items.get((await exercise.getAttribute('data-item-id'))!)!;
	if (item.type === 'cloze') {
		for (const [i, accepted] of item.accepted.entries()) {
			const value =
				mode === 'right' ? accepted[0]! : mode === 'almost' ? accepted[0]!.toUpperCase() : 'xyz';
			await page.getByLabel(`Gap ${i + 1}`).fill(value);
		}
		await page.getByRole('button', { name: 'Check' }).click();
		return mode === 'right' ? 'correct' : mode === 'almost' ? 'near-miss' : 'wrong';
	}
	if (item.type === 'choice') {
		const pick = mode === 'wrong' ? item.options.find((o) => o !== item.answer)! : item.answer;
		await exercise.getByRole('button', { name: new RegExp(`^\\d?\\s*${pick}$`) }).click();
		return mode === 'wrong' ? 'wrong' : 'correct';
	}
	const tiles = page.getByLabel('Tiles');
	const words = item.accepted[0]!.split(' ');
	const order = mode === 'wrong' ? [...words].reverse() : words;
	for (const word of order) {
		await tiles
			.getByRole('button', { name: new RegExp(`^${word}$`, 'i') })
			.first()
			.click();
	}
	await page.getByRole('button', { name: 'Check' }).click();
	return mode === 'wrong' && order.join(' ') !== words.join(' ') ? 'wrong' : 'correct';
}

/** Every item of every point with content, by item id. */
export async function allItems(page: Page): Promise<Map<string, Item>> {
	const res = await page.request.get('/content/catalogue.json');
	const catalogue = (await res.json()) as { points: { level: string; itemCount: number }[] };
	const levels = [...new Set(catalogue.points.filter((p) => p.itemCount > 0).map((p) => p.level))];
	const all = new Map<string, Item>();
	for (const level of levels) {
		const bundle = (await (await page.request.get(`/content/${level}.json`)).json()) as {
			points: { items: Item[] }[];
		};
		for (const point of bundle.points) for (const item of point.items) all.set(item.id, item);
	}
	return all;
}

/** Waits until a setting is committed to IndexedDB (before a full reload). */
export async function waitForSetting(page: Page, key: string, value: unknown): Promise<void> {
	const { expect } = await import('@playwright/test');
	await expect
		.poll(() =>
			page.evaluate(
				(k) =>
					new Promise((done) => {
						const open = indexedDB.open('grammatik-gym');
						open.onsuccess = () => {
							const get = open.result.transaction('settings').objectStore('settings').get(k);
							get.onsuccess = () => {
								done((get.result as { value?: unknown } | undefined)?.value);
								open.result.close();
							};
						};
					}),
				key
			)
		)
		.toBe(value);
}
