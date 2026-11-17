<script lang="ts">
	/**
	 * One item from prompt to feedback. Renders the right exercise component, checks the
	 * answer with the engine, shows the feedback panel and reports the outcome upwards.
	 */
	import { checkItem, type ItemAnswer, type ItemCheck } from '#lib/engine/checker/index.js';
	import type { Item } from '#lib/engine/content/schema.js';
	import type { Snippet } from 'svelte';
	import ChoiceExercise from './ChoiceExercise.svelte';
	import ClozeExercise from './ClozeExercise.svelte';
	import FeedbackPanel from './FeedbackPanel.svelte';
	import OrderExercise from './OrderExercise.svelte';

	export interface ExerciseOutcome {
		item: Item;
		answer: ItemAnswer;
		check: ItemCheck;
		/** Milliseconds from first render to the answer. */
		ms: number;
	}

	let {
		item,
		pointId,
		showLessonLink = true,
		onresult,
		onchecked,
		aside
	}: {
		item: Item;
		pointId: string;
		showLessonLink?: boolean;
		onresult: (outcome: ExerciseOutcome) => void;
		/** Called as soon as the answer is checked (before "Continue"). */
		onchecked?: (outcome: ExerciseOutcome) => void;
		/** Shown under the feedback panel, never instead of it (fun, THEME_AND_FUN.md). */
		aside?: Snippet;
	} = $props();

	let outcome = $state<ExerciseOutcome | undefined>();
	let started = performance.now();

	$effect(() => {
		// New item → reset.
		void item.id;
		outcome = undefined;
		started = performance.now();
	});

	function submit(answer: ItemAnswer): void {
		if (outcome) return;
		outcome = { item, answer, check: checkItem(item, answer), ms: performance.now() - started };
		onchecked?.(outcome);
	}

	function next(): void {
		if (outcome) onresult(outcome);
	}
</script>

<div class="space-y-4" data-testid="exercise" data-item-id={item.id} data-item-type={item.type}>
	{#if !outcome}
		{#key item.id}
			{#if item.type === 'cloze'}
				<ClozeExercise {item} onsubmit={submit} />
			{:else if item.type === 'choice'}
				<ChoiceExercise {item} onsubmit={submit} />
			{:else if item.type === 'order'}
				<OrderExercise {item} onsubmit={submit} />
			{/if}
		{/key}
	{:else}
		<FeedbackPanel {item} check={outcome.check} {pointId} {showLessonLink} oncontinue={next} />
		{@render aside?.()}
	{/if}
</div>
