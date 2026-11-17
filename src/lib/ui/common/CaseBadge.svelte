<script lang="ts">
	/**
	 * Letter badge for a grammatical case: colour + letter + accessible name,
	 * so colour is never the only signal (CLAUDE.md §4).
	 */
	import { t } from '#lib/i18n/index.svelte.js';

	type Case = 'nom' | 'akk' | 'dat' | 'gen';
	let { kase, size = 'sm' }: { kase: Case; size?: 'sm' | 'md' } = $props();

	const letter: Record<Case, string> = { nom: 'N', akk: 'A', dat: 'D', gen: 'G' };
	const colour: Record<Case, string> = {
		nom: 'bg-case-nom',
		akk: 'bg-case-akk',
		dat: 'bg-case-dat',
		gen: 'bg-case-gen'
	};
	const label = $derived(t(`case.${kase}`));
</script>

<span
	class="inline-flex items-center justify-center rounded-md font-bold text-case-badge-text {colour[
		kase
	]} {size === 'md' ? 'h-7 min-w-7 px-1.5 text-sm' : 'h-5 min-w-5 px-1 text-xs'}"
	role="img"
	aria-label={label}
	title={label}
>
	{letter[kase]}
</span>
