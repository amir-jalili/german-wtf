<script lang="ts">
	/**
	 * Sentence builder: tap tiles into the answer line (tap again to remove). Keyboard:
	 * Tab/Enter on tiles, Backspace removes the last tile, Enter on "Check" submits.
	 */
	import type { OrderItem } from '#lib/engine/content/schema.js';
	import type { ItemAnswer } from '#lib/engine/checker/index.js';
	import { hashString, mulberry32, shuffleDifferent } from '#lib/engine/util/rng.js';
	import FeldermodellStrip from './FeldermodellStrip.svelte';

	let { item, onsubmit }: { item: OrderItem; onsubmit: (answer: ItemAnswer) => void } = $props();

	type Tile = { id: number; text: string };
	const pool = $derived<Tile[]>(
		shuffleDifferent(
			item.tiles.map((text, id) => ({ id, text })),
			mulberry32(hashString(item.id))
		)
	);
	let chosen = $state<number[]>([]);
	const remaining = $derived(pool.filter((t) => !chosen.includes(t.id)));
	const chosenTiles = $derived(chosen.map((id) => pool.find((t) => t.id === id)!));

	function add(id: number): void {
		chosen = [...chosen, id];
	}
	function remove(id: number): void {
		chosen = chosen.filter((c) => c !== id);
	}
	function submit(): void {
		onsubmit({ type: 'order', tiles: chosenTiles.map((t) => t.text) });
	}
	function onkeydown(e: KeyboardEvent): void {
		if (e.key === 'Backspace' && !(e.target instanceof HTMLInputElement) && chosen.length) {
			e.preventDefault();
			chosen = chosen.slice(0, -1);
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="space-y-4">
	{#if item.prompt}
		<p class="text-sm text-muted">{item.prompt}</p>
	{/if}
	{#if item.fields}
		<FeldermodellStrip />
	{/if}
	<p class="text-xl leading-relaxed">
		{#if item.prefix}<span>{item.prefix}</span>{/if}
		<span
			class="inline-flex min-h-11 min-w-32 flex-wrap items-center gap-1 rounded-lg border-2 border-dashed border-border px-1 align-middle"
			aria-label="Your answer"
			data-testid="order-answer"
		>
			{#each chosenTiles as tile, i (tile.id)}
				<button
					type="button"
					class="btn-secondary px-3 py-1 text-lg"
					onclick={() => remove(tile.id)}
					aria-label={`Remove ${tile.text}`}
				>
					{i === 0
						? tile.text.charAt(0).toLocaleUpperCase('de-DE') + tile.text.slice(1)
						: tile.text}
				</button>
			{/each}
		</span>
		{#if item.suffix}<span>{item.suffix}</span>{/if}
	</p>
	<ul class="flex flex-wrap gap-2" aria-label="Tiles">
		{#each remaining as tile (tile.id)}
			<li>
				<button type="button" class="btn-primary px-3 text-lg" onclick={() => add(tile.id)}>
					{tile.text}
				</button>
			</li>
		{/each}
	</ul>
	<div class="flex justify-end gap-2">
		<button
			type="button"
			class="btn-secondary"
			onclick={() => (chosen = [])}
			disabled={!chosen.length}>Clear</button
		>
		<button type="button" class="btn-primary" onclick={submit} disabled={remaining.length > 0}
			>Check</button
		>
	</div>
</div>
