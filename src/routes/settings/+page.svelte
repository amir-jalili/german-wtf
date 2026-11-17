<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.svelte.js';
	import { APP_VERSION } from '#lib/version.js';
	import { latestRelease } from '#lib/changelog.js';
	import {
		backupFileName,
		countAnswers,
		exportBackup,
		getDb,
		importBackup,
		readBackupText
	} from '#lib/db/index.js';
	import { settings } from '#lib/stores/settings.svelte.js';
	import { CHAOS_LEVELS, type ChaosLevel } from '#lib/engine/fun/pick.js';
	import Mascot from '#lib/ui/fun/Mascot.svelte';
	import changelog from '../../../CHANGELOG.md?raw';

	const chaosLabels: Record<ChaosLevel, { label: string; hint: string; mood: string }> = {
		off: { label: 'Off', hint: 'Serious mode. Only grammar.', mood: 'sleeping' },
		some: { label: 'Some', hint: 'Milestones, plus one extra per session.', mood: 'loaf' },
		maximum: { label: 'Maximum', hint: 'The cat comments on everything.', mood: 'smug' }
	};

	const release = latestRelease(changelog);
	let answers = $state<number | undefined>();
	let exportError = $state<string | undefined>();
	/** A validated file waiting for "Replace" (nothing is written before that). */
	let pending = $state<{ text: string; answers: number; exportedAt: string } | undefined>();
	let importError = $state<string | undefined>();
	let imported = $state<number | undefined>();
	let importing = $state(false);

	async function chooseFile(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		importError = undefined;
		imported = undefined;
		pending = undefined;
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		try {
			const text = await file.text();
			const { backup } = readBackupText(text);
			pending = { text, answers: backup.tables.reviewLog.length, exportedAt: backup.exportedAt };
		} catch (error) {
			importError = error instanceof Error ? error.message : String(error);
		}
	}

	async function replaceProgress(): Promise<void> {
		if (!pending) return;
		importing = true;
		try {
			const summary = await importBackup(getDb(), pending.text);
			imported = summary.answers;
			answers = summary.answers;
			pending = undefined;
			// Settings came from the backup too.
			settings.reset();
			await settings.load();
		} catch (error) {
			importError = error instanceof Error ? error.message : String(error);
		} finally {
			importing = false;
		}
	}

	onMount(() => {
		void settings.load();
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

<section class="card mt-4 space-y-3 text-sm" aria-labelledby="chaos-h">
	<div class="flex items-center justify-between gap-3">
		<div>
			<h2 id="chaos-h" class="text-base font-semibold">Cat chaos level</h2>
			<p class="text-muted">How often Dativ has an opinion.</p>
		</div>
		<Mascot mood={chaosLabels[settings.value.catChaos].mood} size={64} decorative />
	</div>
	<div role="radiogroup" aria-labelledby="chaos-h" class="grid grid-cols-3 gap-2">
		{#each CHAOS_LEVELS as level (level)}
			{@const selected = settings.value.catChaos === level}
			<button
				type="button"
				role="radio"
				aria-checked={selected}
				class="tap rounded-xl border-2 px-2 py-2 font-semibold {selected
					? 'border-accent bg-accent-soft'
					: 'border-border'}"
				onclick={() => settings.set('catChaos', level)}
			>
				{chaosLabels[level].label}
			</button>
		{/each}
	</div>
	<p class="text-muted" data-testid="chaos-hint">{chaosLabels[settings.value.catChaos].hint}</p>
</section>

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
	<label
		class="btn-secondary cursor-pointer focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent"
	>
		{t('settings.import')}
		<input
			type="file"
			accept="application/json,.json"
			class="sr-only"
			onchange={chooseFile}
			data-testid="import-file"
		/>
	</label>
	{#if pending}
		<div
			class="space-y-2 rounded-xl border border-warn p-3"
			role="alertdialog"
			aria-labelledby="import-q"
			data-testid="import-confirm"
		>
			<p id="import-q">
				{t('settings.importFound')}: {pending.answers}
				{t('settings.importAnswers')}, {new Date(pending.exportedAt).toLocaleString('en-GB')}.
				<strong>{t('settings.importWarning')}</strong>
			</p>
			<div class="flex flex-wrap gap-2">
				<button type="button" class="btn-primary" disabled={importing} onclick={replaceProgress}>
					{t('settings.importReplace')}
				</button>
				<button type="button" class="btn-secondary" onclick={() => (pending = undefined)}>
					{t('settings.importCancel')}
				</button>
			</div>
		</div>
	{/if}
	{#if importError}<p class="text-danger" role="alert" data-testid="import-error">
			{importError}
		</p>{/if}
	{#if imported !== undefined}
		<p class="text-success" role="status" data-testid="import-done">
			{t('settings.importDone')}: {imported}
			{t('settings.importAnswers')}
		</p>
	{/if}
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
