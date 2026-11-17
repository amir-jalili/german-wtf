<script lang="ts">
	/**
	 * Practice one grammar point: 10 items, interleaved types, summary at the end (P1.8).
	 * Every outcome is reported through `onOutcome` (review log, P1.9).
	 */
	import { resolve } from '$app/paths';
	import { getDb, logAnswer } from '#lib/db/index.js';
	import { pickPracticeItems, summarise } from '#lib/engine/session/index.js';
	import { mulberry32 } from '#lib/engine/util/rng.js';
	import Exercise, { type ExerciseOutcome } from '#lib/ui/exercises/Exercise.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const point = $derived(data.point);

	let seed = $state(Date.now());
	const items = $derived(pickPracticeItems(point.items, { count: 10, rng: mulberry32(seed) }));
	let index = $state(0);
	let outcomes = $state<ExerciseOutcome[]>([]);
	const current = $derived(items[index]);
	const summary = $derived(summarise(outcomes.map((o) => o.check.result.verdict)));
	const done = $derived(items.length > 0 && index >= items.length);

	function onresult(outcome: ExerciseOutcome): void {
		// Every answer is logged (P1.9). Never block the session on storage.
		logAnswer(getDb(), { ...outcome, pointId: point.id }).catch((error: unknown) =>
			console.warn('Could not log answer', error)
		);
		outcomes = [...outcomes, outcome];
		index += 1;
	}

	function again(): void {
		seed = Date.now();
		index = 0;
		outcomes = [];
	}
</script>

<svelte:head><title>Practise · {point.title.de}</title></svelte:head>

<header class="mb-4 flex items-center justify-between gap-2">
	<div>
		<p class="text-xs tracking-wide text-muted uppercase">Practise</p>
		<h1 class="text-lg font-bold">{point.title.de}</h1>
	</div>
	{#if !done && items.length}
		<p class="text-sm text-muted" data-testid="progress">{index + 1} / {items.length}</p>
	{/if}
</header>

{#if !items.length}
	<p class="card">No verified exercises for this point yet.</p>
{:else if done}
	<section class="card space-y-3" data-testid="summary">
		<h2 class="text-xl font-bold">Done for now</h2>
		<p class="text-3xl font-bold">{Math.round(summary.accuracy * 100)}%</p>
		<ul class="text-sm">
			<li class="text-success">✅ {summary.correct} correct</li>
			<li class="text-warn">🟡 {summary.nearMiss} almost</li>
			<li class="text-danger">❌ {summary.wrong} wrong</li>
		</ul>
		{#if summary.wrong}
			<details class="text-sm">
				<summary class="cursor-pointer">Review the mistakes</summary>
				<ul class="mt-2 space-y-2">
					{#each outcomes.filter((o) => o.check.result.verdict === 'wrong') as o (o.item.id)}
						<li>
							<span class="text-danger line-through">{o.check.givenSentence}</span> →
							<strong>{o.check.correctSentence}</strong>
						</li>
					{/each}
				</ul>
			</details>
		{/if}
		<div class="flex flex-wrap gap-2 pt-2">
			<button type="button" class="btn-primary" onclick={again}>Practise again</button>
			<a class="btn-secondary" href={resolve('/point/[id]', { id: point.id })}>Open lesson</a>
			<a class="btn-secondary" href={resolve('/')}>Today</a>
		</div>
	</section>
{:else if current}
	<div class="mb-4 h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
		<div
			class="h-full bg-accent transition-all"
			style="width: {(index / items.length) * 100}%"
		></div>
	</div>
	<Exercise item={current} pointId={point.id} {onresult} />
{/if}
