<script lang="ts">
	/**
	 * The five topological fields of a German sentence (PRODUCT_SPEC §3 edge 5). Shown as
	 * labelled zones; when `fields` are given, the canonical words are placed in them.
	 */
	import type { OrderItem } from '#lib/engine/content/schema.js';

	let { fields }: { fields?: OrderItem['fields'] } = $props();

	const zones = [
		{ key: 'vorfeld', de: 'Vorfeld', en: 'front' },
		{ key: 'leftBracket', de: 'linke Klammer', en: 'verb / connector' },
		{ key: 'mittelfeld', de: 'Mittelfeld', en: 'middle' },
		{ key: 'rightBracket', de: 'rechte Klammer', en: 'verb end' },
		{ key: 'nachfeld', de: 'Nachfeld', en: 'after' }
	] as const;

	function wordsOf(key: (typeof zones)[number]['key']): string | undefined {
		if (!fields) return undefined;
		if (key === 'leftBracket') return fields.leftBracket ?? fields.connector;
		return fields[key];
	}
	const visible = $derived(zones.filter((z) => !fields || wordsOf(z.key) !== undefined));
</script>

<ol class="flex flex-wrap gap-1 text-xs" aria-label="Feldermodell">
	{#each visible as zone (zone.key)}
		{@const words = wordsOf(zone.key)}
		<li
			class="flex min-w-16 flex-1 flex-col rounded-md border border-border bg-surface-2 px-2 py-1"
		>
			<span class="text-muted">{zone.de}</span>
			{#if words}
				<span class="text-sm font-medium text-text">{words}</span>
			{/if}
		</li>
	{/each}
</ol>
