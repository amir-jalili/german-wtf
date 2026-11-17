<script lang="ts">
	/** Mastery as 4 segments plus a text label (colour is never the only signal, WCAG). */
	import { MASTERY_LEVELS, type Mastery } from '#lib/engine/scheduler/mastery.js';
	import { t } from '#lib/i18n/index.svelte.js';
	import type { MessageKey } from '#lib/i18n/messages.js';

	let { mastery }: { mastery: Mastery } = $props();
	const filled = $derived(MASTERY_LEVELS.indexOf(mastery));
	const label = $derived(t(`mastery.${mastery}` as MessageKey));
</script>

<span
	class="inline-flex items-center gap-1.5 text-xs text-muted"
	data-testid="mastery"
	data-mastery={mastery}
>
	<span class="flex gap-0.5" aria-hidden="true">
		{#each [1, 2, 3, 4] as segment (segment)}
			<span
				class="h-2.5 w-1.5 rounded-sm {segment <= filled ? 'bg-accent' : 'border border-border'}"
			></span>
		{/each}
	</span>
	<span>{label}</span>
</span>
