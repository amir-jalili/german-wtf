<script lang="ts">
	/**
	 * Result of an answer (PRODUCT_SPEC §5 flow 2): ✅ correct · 🟡 almost · ❌ wrong with
	 * the wrong part highlighted, the correct sentence, the rule and a link to the lesson.
	 */
	import { resolve } from '$app/paths';
	import type { ItemCheck } from '#lib/engine/checker/index.js';
	import type { Item } from '#lib/engine/content/schema.js';
	import Md from '#lib/ui/common/Md.svelte';
	import PlayButton from '#lib/ui/common/PlayButton.svelte';
	import FeldermodellStrip from './FeldermodellStrip.svelte';

	let {
		item,
		check,
		pointId,
		oncontinue,
		showLessonLink = true
	}: {
		item: Item;
		check: ItemCheck;
		pointId: string;
		oncontinue: () => void;
		showLessonLink?: boolean;
	} = $props();

	const verdict = $derived(check.result.verdict);
	const tone = $derived(
		verdict === 'correct' ? 'success' : verdict === 'near-miss' ? 'warn' : 'danger'
	);
	const heading = $derived(
		verdict === 'correct' ? '✅ Correct' : verdict === 'near-miss' ? '🟡 Almost' : '❌ Not quite'
	);
	const feedbackNote = $derived(
		check.result.verdict === 'wrong' ? check.result.feedback : undefined
	);
	const hint = $derived(check.result.verdict === 'near-miss' ? check.result.hint : undefined);

	function onkeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') {
			e.preventDefault();
			oncontinue();
		}
	}
</script>

<svelte:window {onkeydown} />

<section
	class="card space-y-3 border-2"
	class:border-success={tone === 'success'}
	class:border-warn={tone === 'warn'}
	class:border-danger={tone === 'danger'}
	role="status"
	aria-live="polite"
	data-testid="feedback"
	data-verdict={verdict}
>
	<h2
		class="text-lg font-bold"
		class:text-success={tone === 'success'}
		class:text-warn={tone === 'warn'}
		class:text-danger={tone === 'danger'}
	>
		{heading}
	</h2>

	{#if check.result.verdict === 'wrong'}
		<p class="text-lg leading-relaxed" aria-label="Your answer">
			{#each check.result.diff as span, i (i)}
				{#if span.kind === 'wrong'}
					<mark class="rounded bg-danger/20 px-0.5 text-danger line-through decoration-2"
						>{span.text}</mark
					>
				{:else if span.kind === 'missing'}
					<ins class="rounded bg-success/20 px-0.5 text-success no-underline">{span.text}</ins>
				{:else}
					<span class="mr-1">{span.text}</span>
				{/if}
			{/each}
		</p>
	{/if}

	<p class="flex items-center gap-2 text-lg font-semibold">
		<span>{check.correctSentence}</span>
		{#if item.audio}<PlayButton text={check.correctSentence} size="sm" />{/if}
	</p>

	{#if item.type === 'order' && item.fields}
		<FeldermodellStrip fields={item.fields} />
	{/if}

	{#if hint}<p class="text-sm text-warn"><Md text={hint} /></p>{/if}
	{#if feedbackNote}<p class="text-sm"><Md text={feedbackNote} /></p>{/if}
	<p class="text-sm text-muted"><Md text={item.explanation} /></p>

	<div class="flex items-center justify-between gap-2 pt-1">
		{#if showLessonLink}
			<a
				class="text-sm font-medium text-accent underline-offset-2 hover:underline"
				href={resolve('/point/[id]', { id: pointId })}>Open lesson</a
			>
		{:else}<span></span>{/if}
		<button type="button" class="btn-primary" onclick={oncontinue} data-testid="continue"
			>Continue</button
		>
	</div>
</section>
