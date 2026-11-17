<script lang="ts">
	/**
	 * Stats (P2.7): 12-week heatmap, streak (can be hidden), 7-day forecast, mastery per
	 * level, accuracy per family, weakest 5. Every number comes from this device's data.
	 */
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { getDb, loadAnswers, loadSrsState, type SrsState } from '#lib/db/index.js';
	import { LEVELS } from '#lib/engine/content/levels.js';
	import { createScheduler, MASTERY_LEVELS } from '#lib/engine/scheduler/index.js';
	import {
		accuracyByFamily,
		forecast,
		heatmap,
		masteryByLevel,
		streak,
		weakest,
		type StatAnswer
	} from '#lib/engine/session/index.js';
	import { t } from '#lib/i18n/index.svelte.js';
	import type { MessageKey } from '#lib/i18n/messages.js';
	import { settings } from '#lib/stores/settings.svelte.js';
	import Mascot from '#lib/ui/fun/Mascot.svelte';
	import TailSpinner from '#lib/ui/fun/TailSpinner.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const catalogue = $derived(data.catalogue.points);
	const titles = $derived(new Map(catalogue.map((p) => [p.id, p.title.de])));

	let answers = $state<StatAnswer[] | undefined>();
	let srs = $state<SrsState | undefined>();
	const now = new Date();

	onMount(() => {
		void settings.load();
		Promise.all([loadAnswers(getDb()), loadSrsState(getDb(), now)])
			.then(([a, s]) => {
				answers = a;
				srs = s;
			})
			.catch((error: unknown) => {
				console.warn('Could not load stats', error);
				answers = [];
			});
	});

	const grid = $derived(answers ? heatmap(answers, now) : []);
	const activeDays = $derived(grid.filter((d) => d.count > 0).length);
	const total12 = $derived(grid.reduce((n, d) => n + d.count, 0));
	const days = $derived(answers ? streak(answers, now) : 0);
	const coming = $derived(srs ? forecast(srs.cards, srs.mistakeCards, now) : []);
	const maxComing = $derived(Math.max(1, ...coming.map((d) => d.count)));
	const mastery = $derived(srs ? masteryByLevel(catalogue, srs.cards) : new Map());
	const families = $derived(answers ? accuracyByFamily(answers, catalogue) : []);
	const weak = $derived.by(() => {
		if (!srs) return [];
		const s = createScheduler(settings.value.targetRetention);
		return weakest(srs.cards, (c) => s.retrievability(c.fsrs, now));
	});

	const shade = (count: number) =>
		count === 0
			? 'bg-border/40'
			: count < 5
				? 'bg-accent/30'
				: count < 10
					? 'bg-accent/55'
					: count < 20
						? 'bg-accent/80'
						: 'bg-accent';
	const dayLabel = (day: number) =>
		new Date(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
	const weekday = (day: number) => new Date(day).toLocaleDateString('en-GB', { weekday: 'short' });
	const pct = (x: number) => `${Math.round(x * 100)}%`;
	const masteryShade: Record<string, string> = {
		new: 'bg-border',
		learning: 'bg-accent/30',
		familiar: 'bg-accent/55',
		strong: 'bg-accent/80',
		mastered: 'bg-accent'
	};
	const familyLabel = (f: string) => f.charAt(0).toUpperCase() + f.slice(1).replace(/-/g, ' ');
</script>

<svelte:head><title>{t('stats.title')} · {t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('stats.title')}</h1>

{#if !answers}
	<div class="mt-6 flex justify-center"><TailSpinner /></div>
{:else if !answers.length}
	<div class="mt-6 flex flex-col items-center gap-3 text-center" data-testid="stats-empty">
		<Mascot mood="box" size={140} />
		<p class="max-w-xs text-muted">{t('stats.empty')}</p>
	</div>
{:else}
	<div class="mt-4 space-y-4">
		<section class="card flex items-center justify-between gap-3" aria-label={t('stats.streak')}>
			{#if settings.value.showStreak}
				<p data-testid="streak">
					<span class="text-3xl font-bold">🔥 {days}</span>
					<span class="text-muted">{t(days === 1 ? 'stats.day' : 'stats.days')}</span>
				</p>
			{:else}
				<p class="text-muted">{t('stats.streak')}</p>
			{/if}
			<label class="flex tap items-center gap-2 text-sm">
				<input
					type="checkbox"
					class="h-5 w-5 accent-accent"
					checked={settings.value.showStreak}
					onchange={(e) => settings.set('showStreak', e.currentTarget.checked)}
					data-testid="streak-toggle"
				/>
				{t('stats.showStreak')}
			</label>
		</section>

		<section class="card" aria-labelledby="heat-h">
			<h2 id="heat-h" class="mb-1 font-semibold">{t('stats.heatmap')}</h2>
			<p class="mb-3 text-sm text-muted" data-testid="heatmap-summary">
				{total12}
				{t('stats.answers')} · {activeDays}
				{t(activeDays === 1 ? 'stats.activeDay' : 'stats.activeDays')}
			</p>
			<div
				class="grid grid-flow-col grid-rows-7 gap-1"
				style="grid-template-columns: repeat(12, minmax(0, 1fr));"
				data-testid="heatmap"
				aria-hidden="true"
			>
				{#each grid as d (d.day)}
					<div
						class="aspect-square rounded-sm {shade(d.count)} {d.day > now.getTime()
							? 'opacity-0'
							: ''}"
						title="{dayLabel(d.day)}: {d.count}"
					></div>
				{/each}
			</div>
			<p class="mt-2 flex items-center justify-end gap-1 text-xs text-muted" aria-hidden="true">
				{t('stats.less')}
				{#each [0, 1, 5, 10, 20] as c (c)}<span class="h-3 w-3 rounded-sm {shade(c)}"></span>{/each}
				{t('stats.more')}
			</p>
		</section>

		{#if srs}
			<section class="card" aria-labelledby="fc-h">
				<h2 id="fc-h" class="mb-3 font-semibold">{t('stats.forecast')}</h2>
				<ul class="space-y-1.5" data-testid="forecast">
					{#each coming as d (d.day)}
						<li class="flex items-center gap-2 text-sm">
							<span class="w-10 shrink-0 text-muted">{weekday(d.day)}</span>
							<span class="h-3 rounded-sm bg-accent" style="width: {(d.count / maxComing) * 70}%"
							></span>
							<span>{d.count}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section class="card" aria-labelledby="ma-h">
				<h2 id="ma-h" class="mb-3 font-semibold">{t('stats.mastery')}</h2>
				<ul class="space-y-3" data-testid="mastery-levels">
					{#each LEVELS.filter((l) => mastery.has(l)) as level (level)}
						{@const counts = mastery.get(level)!}
						{@const total = MASTERY_LEVELS.reduce((n, m) => n + counts[m], 0)}
						<li>
							<p class="mb-1 text-sm font-semibold">{level}</p>
							<div class="flex h-3 overflow-hidden rounded-full">
								{#each MASTERY_LEVELS as m (m)}
									{#if counts[m]}
										<span class={masteryShade[m]} style="width: {(counts[m] / total) * 100}%"
										></span>
									{/if}
								{/each}
							</div>
							<p class="mt-1 text-xs text-muted">
								{MASTERY_LEVELS.filter((m) => counts[m])
									.map((m) => `${counts[m]} ${t(`mastery.${m}` as MessageKey)}`)
									.join(' · ')}
							</p>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if families.length}
			<section class="card" aria-labelledby="ac-h">
				<h2 id="ac-h" class="mb-3 font-semibold">{t('stats.accuracy')}</h2>
				<ul class="space-y-2" data-testid="accuracy">
					{#each families as f (f.family)}
						<li class="text-sm">
							<span class="flex justify-between">
								<span>{familyLabel(f.family)}</span>
								<span class="text-muted">{pct(f.accuracy)} · {f.answers}</span>
							</span>
							<span class="mt-1 block h-2 rounded-full bg-border/50">
								<span class="block h-2 rounded-full bg-accent" style="width: {f.accuracy * 100}%"
								></span>
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if weak.length}
			<section class="card" aria-labelledby="wk-h">
				<h2 id="wk-h" class="mb-3 font-semibold">{t('stats.weakest')}</h2>
				<ol class="space-y-2" data-testid="weakest">
					{#each weak as w (w.pointId)}
						<li>
							<a
								class="flex tap items-center justify-between gap-2 underline-offset-2 hover:underline"
								href={resolve('/point/[id]', { id: w.pointId })}
							>
								<span>{titles.get(w.pointId) ?? w.pointId}</span>
								<span class="shrink-0 text-sm text-muted">{pct(w.recall)} {t('stats.recall')}</span>
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	</div>
{/if}
