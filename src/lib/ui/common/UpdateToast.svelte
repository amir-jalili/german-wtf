<script lang="ts">
	/**
	 * "New version — reload" (CLAUDE.md §9). Shown when the service worker has downloaded
	 * a new build. The user decides when to reload; "Later" hides it for this session.
	 */
	import { pwa } from '#lib/pwa/register.svelte.js';
	import { t } from '#lib/i18n/index.svelte.js';

	let dismissed = $state(false);
	const visible = $derived(pwa.needRefresh && !dismissed);
</script>

{#if visible}
	<div
		role="status"
		aria-live="polite"
		class="card fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 shadow-lg md:right-6 md:bottom-6 md:left-auto"
	>
		<p class="flex-1 text-sm font-medium">{t('update.available')}</p>
		<button type="button" class="btn-secondary" onclick={() => (dismissed = true)}>
			{t('update.later')}
		</button>
		<button type="button" class="btn-primary" onclick={() => pwa.reloadToUpdate()}>
			{t('update.reload')}
		</button>
	</div>
{/if}
