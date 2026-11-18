<script lang="ts">
	/**
	 * Settings → My books (P2.9b): import a book pack (JSON from `pnpm books:pack`; on iPhone
	 * from Files / iCloud Drive / AirDrop), list imported books, remove one. Importing only adds
	 * or replaces books by slug, so it needs no confirmation; removing keeps all answers.
	 */
	import { onMount } from 'svelte';
	import {
		getDb,
		importBookPack,
		loadBooks,
		removeBook,
		type BookImportSummary,
		type StoredBook
	} from '#lib/db/index.js';
	import { t } from '#lib/i18n/index.svelte.js';

	let books = $state<StoredBook[]>([]);
	let error = $state<string | undefined>();
	let done = $state<BookImportSummary | undefined>();
	let confirmRemove = $state<string | undefined>();

	const itemCount = (book: StoredBook) => book.chapters.reduce((n, c) => n + c.items.length, 0);

	async function refresh(): Promise<void> {
		books = await loadBooks(getDb()).catch(() => []);
	}
	onMount(() => void refresh());

	async function choose(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		error = undefined;
		done = undefined;
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		try {
			done = await importBookPack(getDb(), await file.text());
			await refresh();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function remove(slug: string): Promise<void> {
		confirmRemove = undefined;
		await removeBook(getDb(), slug);
		await refresh();
	}
</script>

<section class="card mt-4 space-y-2 text-sm" aria-labelledby="books-h" data-testid="book-packs">
	<h2 id="books-h" class="text-base font-semibold">{t('books.title')}</h2>
	<p class="text-muted">{t('books.body')}</p>
	{#if books.length}
		<ul class="divide-y divide-border" data-testid="book-list">
			{#each books as book (book.slug)}
				<li class="py-2" data-book={book.slug}>
					<div class="flex items-center justify-between gap-2">
						<div>
							<p class="font-medium">{book.title}</p>
							<p class="text-muted">
								{book.chapters.length}
								{t('books.chapters')} · {itemCount(book)}
								{t('books.items')}
							</p>
						</div>
						<button type="button" class="btn-secondary" onclick={() => (confirmRemove = book.slug)}
							>{t('books.remove')}</button
						>
					</div>
					{#if confirmRemove === book.slug}
						<div class="mt-2 space-y-2 rounded-xl border border-warn p-3" role="alertdialog">
							<p>{t('books.removeConfirm')}</p>
							<div class="flex flex-wrap gap-2">
								<button type="button" class="btn-primary" onclick={() => remove(book.slug)}
									>{t('books.removeYes')}</button
								>
								<button
									type="button"
									class="btn-secondary"
									onclick={() => (confirmRemove = undefined)}>{t('settings.importCancel')}</button
								>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-muted" data-testid="no-books">{t('books.none')}</p>
	{/if}
	<label
		class="btn-secondary cursor-pointer focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent"
	>
		{t('books.import')}
		<input
			type="file"
			accept="application/json,.json"
			class="sr-only"
			onchange={choose}
			data-testid="book-pack-file"
		/>
	</label>
	{#if error}<p class="text-danger" role="alert" data-testid="book-pack-error">{error}</p>{/if}
	{#if done}
		<p class="text-success" role="status" data-testid="book-pack-done">
			{#each done.books as b (b.slug)}
				{b.replaced ? t('books.updated') : t('books.imported')}: {b.title} ({b.chapters}
				{t('books.chapters')}, {b.items}
				{t('books.items')})
			{/each}
		</p>
	{/if}
</section>
