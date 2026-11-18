<script lang="ts">
	/**
	 * Grammar map (P2.6): every catalogue point by level and family, with mastery, due
	 * badges, prerequisite hints and search. Points without exercises show "coming soon".
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { loadAllBooks } from '#lib/content/books.js';
	import { getDb, loadSrsState, type StoredBook } from '#lib/db/index.js';
	import { LEVELS } from '#lib/engine/content/levels.js';
	import type { MistakeCard, PointCard } from '#lib/engine/scheduler/index.js';
	import {
		buildMap,
		chapterProgress,
		matchesSearch,
		type ChapterProgress
	} from '#lib/engine/session/index.js';
	import { handOffChapter } from '#lib/srs/daily.js';
	import ChapterList from '#lib/ui/books/ChapterList.svelte';
	import { t } from '#lib/i18n/index.svelte.js';
	import MasteryBadge from '#lib/ui/common/MasteryBadge.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const points = $derived(data.catalogue.points);
	const titles = $derived(new Map(points.map((p) => [p.id, p.title.de])));

	let cards = $state<PointCard[]>([]);
	let mistakeCards = $state<MistakeCard[]>([]);
	let query = $state('');
	let books = $state<StoredBook[]>([]);
	let answeredIds = $state<Set<string>>(new Set());
	/** "My books" tab (P2.9c); shown only when a book pack is imported. */
	let tab = $state<'grammar' | 'books'>('grammar');

	onMount(() => {
		loadSrsState(getDb(), new Date())
			.then((s) => {
				cards = s.cards;
				mistakeCards = s.mistakeCards;
				answeredIds = new Set(s.lastSeen.keys());
			})
			.catch((error: unknown) => console.warn('Could not load progress', error));
		loadAllBooks()
			.then((b) => (books = b))
			.catch(() => undefined);
	});

	const chapters = $derived(chapterProgress(books, cards, answeredIds));

	async function practise(chapter: ChapterProgress): Promise<void> {
		if (await handOffChapter(chapter.bookSlug, chapter.id)) await goto(resolve('/session'));
	}

	const map = $derived(buildMap(points, cards, mistakeCards, new Date()));
	const visible = $derived(map.filter((m) => matchesSearch(m.entry, query)));
	const readyCount = $derived(map.filter((m) => m.ready).length);
	const searching = $derived(query.trim().length > 0);
	const familyLabel = (family: string) =>
		family.charAt(0).toUpperCase() + family.slice(1).replace(/-/g, ' ');
</script>

<svelte:head><title>{t('map.title')} · {t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('map.title')}</h1>
{#if books.length}
	<div class="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label={t('map.title')}>
		{#each [['grammar', t('map.grammar')], ['books', t('books.title')]] as const as [id, label] (id)}
			<button
				type="button"
				role="tab"
				id="tab-{id}"
				aria-selected={tab === id}
				aria-controls="panel-{id}"
				class="tap rounded-xl border-2 px-2 py-2 font-semibold {tab === id
					? 'border-accent bg-accent-soft'
					: 'border-border'}"
				onclick={() => (tab = id)}>{label}</button
			>
		{/each}
	</div>
{/if}

{#if tab === 'books' && books.length}
	<div id="panel-books" role="tabpanel" aria-labelledby="tab-books" data-testid="my-books">
		<ChapterList {chapters} onpractise={practise} />
	</div>
{:else}
	<div id="panel-grammar" role="tabpanel" aria-labelledby="tab-grammar">
		<p class="mt-1 text-sm text-muted">
			{readyCount}
			{t('map.of')}
			{points.length}
			{t('map.ready')}
		</p>

		<label class="mt-4 block">
			<span class="sr-only">{t('map.search')}</span>
			<input
				type="search"
				class="tap w-full rounded-xl border border-border bg-surface px-3 py-2"
				placeholder={t('map.searchPlaceholder')}
				aria-label={t('map.search')}
				bind:value={query}
				data-testid="map-search"
			/>
		</label>

		{#if !visible.length}
			<p class="mt-6 text-center text-muted" data-testid="map-empty">{t('map.noResults')}</p>
		{/if}

		{#each LEVELS as level (level)}
			{@const levelPoints = visible.filter((m) => m.entry.level === level)}
			{#if levelPoints.length}
				{@const levelReady = levelPoints.filter((m) => m.ready).length}
				<details class="mt-5" open={searching || levelReady > 0} data-testid="level-{level}">
					<summary class="flex tap cursor-pointer items-center gap-2 font-semibold">
						<span class="text-lg">{level}</span>
						<span class="text-sm font-normal text-muted">
							{levelReady} / {levelPoints.length}
						</span>
					</summary>
					{#each [...new Set(levelPoints.map((m) => m.entry.family))] as family (family)}
						<h2 class="mt-3 mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
							{familyLabel(family)}
						</h2>
						<ul class="space-y-2">
							{#each levelPoints.filter((m) => m.entry.family === family) as m (m.entry.id)}
								<li data-testid="map-point" data-point-id={m.entry.id}>
									{#if m.ready}
										<a
											class="card block hover:border-accent"
											href={resolve('/point/[id]', { id: m.entry.id })}
										>
											<span class="flex items-start justify-between gap-3">
												<span>
													<span class="block font-semibold">{m.entry.title.de}</span>
													<span class="block text-sm text-muted">{m.entry.title.en}</span>
												</span>
												{#if m.due}
													<span
														class="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-contrast"
														data-testid="due-badge">{m.due} {t('map.due')}</span
													>
												{/if}
											</span>
											<span class="mt-2 flex flex-wrap items-center justify-between gap-2">
												<MasteryBadge mastery={m.mastery} />
												<span class="text-xs text-muted"
													>{m.entry.itemCount} {t('map.exercises')}</span
												>
											</span>
											{#if m.missingPrerequisites.length}
												<span class="mt-1 block text-xs text-warn" data-testid="prereq-hint">
													{t('map.learnFirst')}: {m.missingPrerequisites
														.map((p) => titles.get(p) ?? p)
														.join(', ')}
												</span>
											{/if}
										</a>
									{:else}
										<div class="card flex items-start justify-between gap-3 border-dashed">
											<span>
												<span class="block font-semibold">{m.entry.title.de}</span>
												<span class="block text-sm text-muted">{m.entry.title.en}</span>
											</span>
											<span class="shrink-0 text-xs text-muted" data-testid="coming-soon">
												{t('map.comingSoon')}
											</span>
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					{/each}
				</details>
			{/if}
		{/each}
	</div>
{/if}
