<script lang="ts">
	/**
	 * Minimal grammar map (Phase 1): the points that already have a lesson, by level. The full
	 * map with families, mastery and search is ROADMAP P2.6.
	 */
	import { resolve } from '$app/paths';
	import { LEVELS } from '#lib/engine/content/levels.js';
	import { t } from '#lib/i18n/index.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const points = $derived(data.catalogue.points);
	const ready = $derived(points.filter((p) => p.hasLesson));
</script>

<svelte:head><title>{t('map.title')} · {t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('map.title')}</h1>
<p class="mt-1 text-sm text-muted">
	{ready.length} of {points.length} grammar points ready. The rest are coming.
</p>

{#each LEVELS as level (level)}
	{@const levelPoints = ready.filter((p) => p.level === level)}
	{#if levelPoints.length}
		<section class="mt-5" aria-labelledby="level-{level}">
			<h2 id="level-{level}" class="mb-2 text-sm font-semibold tracking-wide text-muted">
				{level}
			</h2>
			<ul class="space-y-2">
				{#each levelPoints as point (point.id)}
					<li>
						<a
							class="card flex items-center justify-between gap-3 hover:border-accent"
							href={resolve('/point/[id]', { id: point.id })}
						>
							<span>
								<span class="block font-semibold">{point.title.de}</span>
								<span class="block text-sm text-muted">{point.title.en}</span>
							</span>
							<span class="shrink-0 text-sm text-muted">{point.itemCount} exercises</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/each}
