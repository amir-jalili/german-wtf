<script lang="ts">
	/** Pick one option. Tap = answer; keys 1–6 on desktop. */
	import type { ChoiceItem } from '#lib/engine/content/schema.js';
	import type { ItemAnswer } from '#lib/engine/checker/index.js';

	let { item, onsubmit }: { item: ChoiceItem; onsubmit: (answer: ItemAnswer) => void } = $props();

	function pick(option: string): void {
		onsubmit({ type: 'choice', option });
	}
	function onkeydown(e: KeyboardEvent): void {
		const n = Number(e.key);
		if (n >= 1 && n <= item.options.length && !e.metaKey && !e.ctrlKey && !e.altKey) {
			e.preventDefault();
			pick(item.options[n - 1]!);
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="space-y-4">
	{#if item.prompt}
		<p class="text-sm text-muted">{item.prompt}</p>
	{/if}
	<p class="text-xl leading-relaxed">
		{item.text}
		{#if item.hint}<span class="ml-1 text-base text-muted">{item.hint}</span>{/if}
	</p>
	<ul class="grid grid-cols-2 gap-2" role="list">
		{#each item.options as option, i (option)}
			<li>
				<button type="button" class="btn-secondary w-full text-lg" onclick={() => pick(option)}>
					<span class="mr-1 text-xs text-muted" aria-hidden="true">{i + 1}</span>
					{option}
				</button>
			</li>
		{/each}
	</ul>
</div>
