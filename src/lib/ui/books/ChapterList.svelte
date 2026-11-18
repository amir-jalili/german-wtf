<script lang="ts">
	/** My books (P2.9c): book → chapter → mastery, answered items and "Practise chapter". */
	import type { ChapterProgress } from '#lib/engine/session/index.js';
	import { t } from '#lib/i18n/index.svelte.js';
	import MasteryBadge from '#lib/ui/common/MasteryBadge.svelte';

	let {
		chapters,
		onpractise
	}: { chapters: ChapterProgress[]; onpractise: (chapter: ChapterProgress) => void } = $props();

	const books = $derived([...new Map(chapters.map((c) => [c.bookSlug, c.bookTitle]))]);
</script>

{#each books as [slug, title] (slug)}
	<section class="mt-5" data-testid="book" data-book={slug}>
		<h2 class="mb-2 text-lg font-semibold">{title}</h2>
		<ul class="space-y-2">
			{#each chapters.filter((c) => c.bookSlug === slug) as chapter (chapter.id)}
				<li class="card space-y-2" data-testid="chapter" data-chapter={chapter.id}>
					<p class="font-semibold">{t('books.chapter')} {chapter.id}: {chapter.title}</p>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<MasteryBadge mastery={chapter.mastery} />
						<span class="text-xs text-muted" data-testid="chapter-answered">
							{chapter.answered} / {chapter.items}
							{t('books.answered')}
						</span>
					</div>
					<button type="button" class="btn-secondary w-full" onclick={() => onpractise(chapter)}>
						{t('books.practise')}
						{chapter.id}
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/each}
