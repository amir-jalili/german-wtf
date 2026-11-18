<script lang="ts">
	/**
	 * The daily session (P2.5): runs the plan from Today, logs every answer with its step
	 * source, rebuilds the point's cards after each answer, and ends with what came back,
	 * what got stronger and what got fixed.
	 */
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { getDb, loadSrsState } from '#lib/db/index.js';
	import { endsWithWrongStreak, sessionEndEvents, type FunPick } from '#lib/engine/fun/pick.js';
	import type { Mastery } from '#lib/engine/scheduler/index.js';
	import {
		progressEvents,
		sessionProgress,
		summarise,
		type SessionProgress,
		type SessionStep
	} from '#lib/engine/session/index.js';
	import type { MessageKey } from '#lib/i18n/messages.js';
	import { t } from '#lib/i18n/index.svelte.js';
	import { presentItem } from '#lib/engine/content/present.js';
	import { prepareToday, recordStepAnswer, takePlan, type TodayData } from '#lib/srs/daily.js';
	import { FunSession } from '#lib/stores/fun.svelte.js';
	import Exercise, { type ExerciseOutcome } from '#lib/ui/exercises/Exercise.svelte';
	import Mascot from '#lib/ui/fun/Mascot.svelte';
	import MascotBubble from '#lib/ui/fun/MascotBubble.svelte';
	import PawProgress from '#lib/ui/fun/PawProgress.svelte';
	import TailSpinner from '#lib/ui/fun/TailSpinner.svelte';

	let today = $state<TodayData | undefined>();
	let failed = $state(false);
	let index = $state(0);
	let answered = $state<
		{ step: SessionStep; verdict: ExerciseOutcome['check']['result']['verdict'] }[]
	>([]);
	let checked = $state<string[]>([]);
	let progress = $state<SessionProgress | undefined>();
	let itemFun = $state<FunPick | undefined>();
	let endFun = $state<FunPick | undefined>();
	/** Answers are saved in order; the summary waits for the last one. */
	let saving: Promise<void> = Promise.resolve();
	const fun = new FunSession();

	onMount(() => {
		const handed = takePlan();
		(handed ? Promise.resolve(handed) : prepareToday()).then(
			(data) => (today = data),
			(error: unknown) => {
				console.warn('Could not prepare the session', error);
				failed = true;
			}
		);
	});

	const steps = $derived(today?.plan.steps ?? []);
	const current = $derived(steps[index]);
	const shown = $derived(
		current && today ? presentItem(current.item, today.settings.answerPreference) : undefined
	);
	const done = $derived(steps.length > 0 && index >= steps.length);
	const summary = $derived(summarise(answered.map((a) => a.verdict)));
	const title = (pointId: string) => today?.points.get(pointId)?.title.de ?? pointId;
	const sourceLabel: Record<SessionStep['source'], MessageKey> = {
		due: 'session.review',
		mistake: 'session.mistake',
		new: 'session.new',
		chapter: 'session.chapter'
	};
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
		const step = current;
		if (!step || !today) return;
		const retention = today.settings.targetRetention;
		saving = saving
			.then(() => recordStepAnswer(step, outcome, retention))
			.catch((error: unknown) => console.warn('Could not save answer', error));
		answered = [...answered, { step, verdict: outcome.check.result.verdict }];
		itemFun = undefined;
		index += 1;
		if (index >= steps.length) void finish();
	}

	async function finish(): Promise<void> {
		if (!today) return;
		await saving;
		const before = today.state;
		const after = await loadSrsState(getDb(), new Date());
		progress = sessionProgress(answered, before, after);
		const firstSession = before.lastAnswerAt === undefined;
		const verdicts = answered.map((a) => a.verdict);
		endFun = await fun.pick([
			...progressEvents(progress),
			...sessionEndEvents(verdicts, new Date(), firstSession)
		]);
	}

	const masteryLabel = (m: Mastery) => t(`mastery.${m}` as MessageKey);
</script>

<svelte:head><title>{t('session.title')} · {t('app.name')}</title></svelte:head>

<header class="mb-4 flex items-center justify-between gap-2">
	<div>
		<p class="text-xs tracking-wide text-muted uppercase">{t('session.title')}</p>
		{#if current && !done}
			<h1 class="text-lg font-bold">{title(current.pointId)}</h1>
		{:else}
			<h1 class="text-lg font-bold">{t('today.title')}</h1>
		{/if}
	</div>
	{#if current && !done}
		<div
			class="flex shrink-0 items-center gap-2"
			data-testid="header-mascot"
			data-mood={headerMood}
		>
			<Mascot mood={headerMood} size={44} decorative />
			<p class="shrink-0 text-sm whitespace-nowrap text-muted" data-testid="progress">
				{index + 1} / {steps.length}
			</p>
		</div>
	{/if}
</header>

{#if failed}
	<p class="card" role="alert">{t('today.loadError')}</p>
{:else if !today}
	<div class="flex justify-center"><TailSpinner /></div>
{:else if !steps.length}
	<section class="card space-y-3 text-center" data-testid="nothing-due">
		<p class="font-semibold">{t('today.nothingDue')}</p>
		<a class="btn-secondary" href={resolve('/')}>{t('session.again')}</a>
	</section>
{:else if done}
	<section class="card space-y-3" data-testid="summary" data-ready={progress ? 'true' : 'false'}>
		<h2 class="text-xl font-bold">{t('session.done')}</h2>
		{#if endFun}<MascotBubble pick={endFun} />{/if}
		<p class="text-3xl font-bold">{Math.round(summary.accuracy * 100)}%</p>
		<ul class="text-sm">
			<li class="text-success">✅ {summary.correct} correct</li>
			<li class="text-warn">🟡 {summary.nearMiss} almost</li>
			<li class="text-danger">❌ {summary.wrong} wrong</li>
		</ul>
		{#if !progress}
			<TailSpinner />
		{:else}
			{#if progress.cameBack.length}
				<div data-testid="came-back">
					<h3 class="font-semibold">{t('session.cameBack')}</h3>
					<p class="text-sm">{progress.cameBack.map(title).join(' · ')}</p>
				</div>
			{/if}
			{#if progress.levelUps.length}
				<div data-testid="level-ups">
					<h3 class="font-semibold">{t('session.levelUps')}</h3>
					<ul class="text-sm">
						{#each progress.levelUps as up (up.pointId)}
							<li>
								{title(up.pointId)}: {masteryLabel(up.from)} →
								<strong>{masteryLabel(up.to)}</strong>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if progress.resolvedMistakes.length}
				<p class="text-sm" data-testid="resolved">
					🩹 {t('session.resolved')}: {progress.resolvedMistakes.length}
				</p>
			{/if}
			{#if progress.newLeeches.length}
				<p class="text-sm text-warn" data-testid="leeches">{t('session.leech')}</p>
			{/if}
		{/if}
		<div class="flex flex-wrap gap-2 pt-2">
			<a class="btn-primary" href={resolve('/')}>{t('session.again')}</a>
		</div>
	</section>
{:else if current}
	<div class="mb-2 flex items-center justify-between text-xs text-muted">
		<span data-testid="step-source">{t(sourceLabel[current.source])}</span>
	</div>
	<div class="mb-4"><PawProgress done={index} total={steps.length} label="Exercises done" /></div>
	{#if current.scaffold}
		<p class="card mb-3 text-sm" data-testid="scaffold-hint">
			{t('session.scaffold')}
			<a class="underline" href={resolve('/point/[id]', { id: current.pointId })}
				>{title(current.pointId)}</a
			>
		</p>
	{/if}
	{#key index}
		<Exercise item={shown ?? current.item} pointId={current.pointId} {onresult} {onchecked}>
			{#snippet aside()}
				{#if itemFun}<MascotBubble pick={itemFun} size={64} />{/if}
			{/snippet}
		</Exercise>
	{/key}
{/if}
