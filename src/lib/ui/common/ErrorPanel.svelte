<script lang="ts">
	/**
	 * "Never a blank screen" (CLAUDE.md §4): shown by the root <svelte:boundary> and by
	 * +error.svelte. The debug info (message, stack, version, URL, user agent) can be
	 * copied in one tap and pasted into a bug report.
	 */
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n/index.svelte.js';
	import { APP_VERSION } from '#lib/version.js';

	let { error, reset }: { error: unknown; reset?: () => void } = $props();
	let copied = $state(false);

	const message = $derived(error instanceof Error ? error.message : String(error));
	const stack = $derived(error instanceof Error ? (error.stack ?? '') : '');

	function debugInfo(): string {
		return [
			`German WTF ${APP_VERSION}`,
			`URL: ${location.href}`,
			`Time: ${new Date().toISOString()}`,
			`UA: ${navigator.userAgent}`,
			`Error: ${message}`,
			stack
		].join('\n');
	}

	async function copy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(debugInfo());
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard blocked (e.g. non-secure context): the <pre> below stays selectable.
		}
	}
</script>

<section class="card mx-auto my-8 max-w-md" role="alert" aria-live="assertive">
	<h1 class="text-xl font-bold">{t('error.title')}</h1>
	<p class="mt-2 text-sm text-muted">{t('error.body')}</p>
	<pre
		class="mt-3 max-h-40 overflow-auto rounded-lg bg-surface-2 p-3 text-xs break-words whitespace-pre-wrap">{message}</pre>
	<div class="mt-4 flex flex-wrap gap-2">
		<button type="button" class="btn-primary" onclick={copy}>
			{copied ? t('error.copied') : t('error.copy')}
		</button>
		{#if reset}
			<button type="button" class="btn-secondary" onclick={reset}>Try again</button>
		{/if}
		<a href={resolve('/')} class="btn-secondary">{t('error.home')}</a>
	</div>
</section>
