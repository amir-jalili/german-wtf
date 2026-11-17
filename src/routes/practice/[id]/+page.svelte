<script lang="ts">
	/**
	 * Practice one grammar point: 10 items, interleaved types, summary at the end (P1.8).
	 * Every answer is logged (P1.9). Fun (P1.12): a line for near-misses and a 3-wrong streak
	 * under the feedback, Dativ's pose in the header, and a bubble on the summary screen.
	 */
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { countAnswers, getDb, logAnswer } from '#lib/db/index.js';
	import { endsWithWrongStreak, sessionEndEvents, type FunPick } from '#lib/engine/fun/pick.js';
	import { pickPracticeItems, summarise } from '#lib/engine/session/index.js';
	import { mulberry32 } from '#lib/engine/util/rng.js';
	import { FunSession } from '#lib/stores/fun.svelte.js';
	import Exercise, { type ExerciseOutcome } from '#lib/ui/exercises/Exercise.svelte';
	import Mascot from '#lib/ui/fun/Mascot.svelte';
	import MascotBubble from '#lib/ui/fun/MascotBubble.svelte';
	import PawProgress from '#lib/ui/fun/PawProgress.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const point = $derived(data.point);

	let seed = $state(Date.now());
	const items = $derived(pickPracticeItems(point.items, { count: 10, rng: mulberry32(seed) }));
	let index = $state(0);
	let outcomes = $state<ExerciseOutcome[]>([]);
	const current = $derived(items[index]);
	const verdicts = $derived(outcomes.map((o) => o.check.result.verdict));
	const summary = $derived(summarise(verdicts));
	const done = $derived(items.length > 0 && index >= items.length);

	let fun = new FunSession();
	let itemFun = $state<FunPick | undefined>();
	let endFun = $state<FunPick | undefined>();
	let firstSession = false;
	/** Verdicts including the item currently showing feedback. */
	let checked = $state<string[]>([]);

	onMount(() => {
		countAnswers(getDb())
			.then((n) => (firstSession = n === 0))
			.catch(() => undefined);
	});

	const headerMood = $derived.by(() => {
		if (endsWithWrongStreak(checked)) return 'flat-on-keyboard';
		if (checked.length >= 3 && checked.slice(-3).every((v) => v !== 'wrong')) return 'smug';
		return 'loaf';
	});

	async function onchecked(outcome: ExerciseOutcome): Promise<void> {
		checked = [...checked, outcome.check.result.verdict];
		itemFun = undefined;
		const event = endsWithWrongStreak(checked)
			? 'wrong-streak-3'
			: outcome.check.result.verdict === 'near-miss'
				? 'near-miss'
				: undefined;
		if (event) itemFun = await fun.pick([event]);
	}

	function onresult(outcome: ExerciseOutcome): void {
		// Every answer is logged (P1.9). Never block the session on storage.
		logAnswer(getDb(), { ...outcome, pointId: point.id }).catch((error: unknown) =>
			console.warn('Could not log answer', error)
		);
		outcomes = [...outcomes, outcome];
		itemFun = undefined;
		index += 1;
		if (index >= items.length) {
			void fun.pick(sessionEndEvents(verdicts, new Date(), firstSession)).then((p) => (endFun = p));
		}
	}

	function again(): void {
		seed = Date.now();
		index = 0;
		outcomes = [];
		checked = [];
		endFun = undefined;
		firstSession = false;
		fun = new FunSession();
	}
</script>

<svelte:head><title>Practise · {point.title.de}</title></svelte:head>

<header class="mb-4 flex items-center justify-between gap-2">
	<div>
		<p class="text-xs tracking-wide text-muted uppercase">Practise</p>
		<h1 class="text-lg font-bold">{point.title.de}</h1>
	</div>
	{#if !done && items.length}
		<div
			class="flex shrink-0 items-center gap-2"
			data-testid="header-mascot"
			data-mood={headerMood}
		>
			<Mascot mood={headerMood} size={44} decorative />
			<p class="shrink-0 text-sm whitespace-nowrap text-muted" data-testid="progress">
				{index + 1} / {items.length}
			</p>
		</div>
	{/if}
</header>

{#if !items.length}
	<p class="card">No verified exercises for this point yet.</p>
{:else if done}
	<section class="card space-y-3" data-testid="summary">
		<h2 class="text-xl font-bold">Done for now</h2>
		{#if endFun}<MascotBubble pick={endFun} />{/if}
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
	<div class="mb-4"><PawProgress done={index} total={items.length} label="Exercises done" /></div>
	<Exercise item={current} pointId={point.id} {onresult} {onchecked}>
		{#snippet aside()}
			{#if itemFun}<MascotBubble pick={itemFun} size={64} />{/if}
		{/snippet}
	</Exercise>
{/if}
