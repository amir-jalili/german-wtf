<script lang="ts">
	/** Typed gap(s) inside a sentence. Enter submits; the umlaut bar inserts ä ö ü ß. */
	import { onMount } from 'svelte';
	import { splitCloze } from '#lib/engine/content/cloze.js';
	import type { ClozeItem } from '#lib/engine/content/schema.js';
	import type { ItemAnswer } from '#lib/engine/checker/index.js';
	import UmlautBar from './UmlautBar.svelte';

	let { item, onsubmit }: { item: ClozeItem; onsubmit: (answer: ItemAnswer) => void } = $props();

	const segments = $derived(splitCloze(item.text));
	const gapCount = $derived(segments.filter((s) => s.kind === 'gap').length);
	// Writable derived: resets when the item changes, editable by the inputs.
	let values = $derived(Array.from({ length: gapCount }, () => ''));
	let inputs: HTMLInputElement[] = $state([]);
	let focused = $state<HTMLInputElement | undefined>();

	onMount(() => inputs[0]?.focus());

	function submit(): void {
		onsubmit({ type: 'cloze', gaps: values.map((v) => v.trim()) });
	}

	function onkeydown(e: KeyboardEvent, index: number): void {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (index < gapCount - 1 && !values[index + 1]) inputs[index + 1]?.focus();
			else submit();
		}
	}
</script>

<form
	class="space-y-4"
	onsubmit={(e) => {
		e.preventDefault();
		submit();
	}}
>
	{#if item.prompt}
		<p class="text-sm text-muted">{item.prompt}</p>
	{/if}
	<p class="text-xl leading-relaxed">
		{#each segments as segment, i (i)}
			{#if segment.kind === 'gap'}
				<input
					bind:this={inputs[segment.gap ?? 0]}
					bind:value={values[segment.gap ?? 0]}
					type="text"
					class="mx-0.5 inline-block min-h-11 w-[7.5em] rounded-lg border-2 border-border bg-surface px-2 text-center align-baseline focus:border-accent"
					style="width: {Math.max(5, segment.value.length + 2)}ch"
					autocapitalize="off"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
					aria-label={`Gap ${(segment.gap ?? 0) + 1}`}
					onfocus={(e) => (focused = e.currentTarget)}
					onkeydown={(e) => onkeydown(e, segment.gap ?? 0)}
				/>
			{:else}
				{segment.value}
			{/if}
		{/each}
		{#if item.hint}
			<span class="ml-1 text-base text-muted">{item.hint}</span>
		{/if}
	</p>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<UmlautBar target={focused ?? inputs[0]} />
		<button type="submit" class="btn-primary">Check</button>
	</div>
</form>
