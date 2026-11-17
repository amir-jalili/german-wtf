<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.svelte.js';
	import { APP_VERSION } from '#lib/version.js';
	import { latestRelease } from '#lib/changelog.js';
	import { backupFileName, countAnswers, exportBackup, getDb } from '#lib/db/index.js';
	import changelog from '../../../CHANGELOG.md?raw';

	const release = latestRelease(changelog);
	let answers = $state<number | undefined>();
	let exportError = $state<string | undefined>();

	onMount(() => {
		countAnswers(getDb())
			.then((n) => (answers = n))
			.catch(() => (answers = undefined));
	});

	async function downloadBackup(): Promise<void> {
		exportError = undefined;
		try {
			const backup = await exportBackup(getDb(), APP_VERSION);
			const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = backupFileName();
			a.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) {
			exportError = error instanceof Error ? error.message : String(error);
		}
	}
</script>

<svelte:head><title>{t('settings.title')} · {t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('settings.title')}</h1>

<section class="card mt-4 space-y-2 text-sm" aria-labelledby="backup-h">
	<h2 id="backup-h" class="text-base font-semibold">{t('settings.backup')}</h2>
	<p class="text-muted">{t('settings.backupBody')}</p>
	{#if answers !== undefined}
		<p data-testid="answer-count">{answers} {t('settings.answersSaved')}</p>
	{/if}
	<button type="button" class="btn-secondary" onclick={downloadBackup}
		>{t('settings.export')}</button
	>
	{#if exportError}<p class="text-danger" role="alert">{exportError}</p>{/if}
</section>

<section class="card mt-4 text-sm">
	<div class="flex justify-between">
		<span class="text-muted">{t('settings.version')}</span>
		<span data-testid="app-version">{APP_VERSION}</span>
	</div>
	{#if release}
		<h2 class="mt-3 font-semibold">{t('settings.whatsNew')} {release.version}</h2>
		<ul class="mt-1 list-disc pl-5 text-muted" data-testid="whats-new">
			{#each release.lines.slice(0, 5) as line (line)}
				<li>{line}</li>
			{/each}
		</ul>
	{/if}
</section>
