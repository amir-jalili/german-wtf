<script lang="ts">
	/**
	 * Today (P2.5): one button starts the day's mix — due reviews, mistakes, new points —
	 * built by the engine's session builder from the cards on this device.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { FunPick } from '#lib/engine/fun/pick.js';
	import { t } from '#lib/i18n/index.svelte.js';
	import { handOffPlan, prepareToday, type TodayData } from '#lib/srs/daily.js';
	import { FunSession } from '#lib/stores/fun.svelte.js';
	import Mascot from '#lib/ui/fun/Mascot.svelte';
	import MascotBubble from '#lib/ui/fun/MascotBubble.svelte';
	import TailSpinner from '#lib/ui/fun/TailSpinner.svelte';

	let today = $state<TodayData | undefined>();
	let failed = $state(false);
	let fun = $state<FunPick | undefined>();

	onMount(() => {
		prepareToday()
			.then(async (data) => {
				today = data;
				if (!data.plan.steps.length) fun = await new FunSession().pick(['nothing-due']);
			})
			.catch((error: unknown) => {
				console.warn('Could not prepare today', error);
				failed = true;
			});
	});

	const plan = $derived(today?.plan);
	const newTitles = $derived.by(() => {
		if (!today) return [];
		const ids = [
			...new Set(today.plan.steps.filter((s) => s.source === 'new').map((s) => s.pointId))
		];
		return ids.map((id) => today?.points.get(id)?.title.de ?? id);
	});

	function start(): void {
		if (!today) return;
		handOffPlan(today);
		void goto(resolve('/session'));
	}
</script>

<svelte:head><title>{t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('today.title')}</h1>
<div class="mt-4 flex flex-col items-center gap-2 text-center">
	<Mascot mood={plan && !plan.steps.length ? 'sleeping' : 'loaf'} size={160} />
	<p class="text-lg font-bold text-accent" data-testid="tagline">{t('app.tagline')}</p>
</div>

{#if failed}
	<p class="card mt-4" role="alert">{t('today.loadError')}</p>
{:else if !plan}
	<div class="mt-6 flex justify-center"><TailSpinner /></div>
{:else if plan.steps.length}
	<section class="card mt-4 space-y-3" data-testid="today-session" aria-labelledby="today-h">
		<h2 id="today-h" class="text-lg font-semibold">{t('today.session')}</h2>
		<ul class="space-y-1 text-sm" data-testid="today-counts">
			{#if plan.counts.due}
				<li data-testid="count-due">🔁 {t('today.due')}: {plan.counts.due}</li>
			{/if}
			{#if plan.counts.mistakes}
				<li data-testid="count-mistakes">🩹 {t('today.mistakes')}: {plan.counts.mistakes}</li>
			{/if}
			{#if plan.counts.newPoints}
				<li data-testid="count-new">✨ {t('today.newPoints')}: {newTitles.join(', ')}</li>
			{/if}
		</ul>
		{#if plan.overflow.due + plan.overflow.mistakes}
			<p class="text-xs text-muted">
				+{plan.overflow.due + plan.overflow.mistakes}
				{t('today.overflow')}
			</p>
		{/if}
		<button type="button" class="btn-primary w-full" onclick={start} data-testid="start-session">
			{t('today.start')} · {plan.steps.length}
			{t('today.items')} · ~{plan.minutes}
			{t('today.minutes')}
		</button>
	</section>
{:else}
	<section class="mt-4 space-y-3 text-center" data-testid="nothing-due">
		<p class="font-semibold">{t('today.nothingDue')}</p>
		<p class="text-muted">{t('today.nothingDueBody')}</p>
		{#if fun}<div class="text-left"><MascotBubble pick={fun} size={64} /></div>{/if}
	</section>
{/if}

<div class="mt-6 flex justify-center">
	<a class="btn-secondary" href={resolve('/map')}>{t('today.toMap')}</a>
</div>
