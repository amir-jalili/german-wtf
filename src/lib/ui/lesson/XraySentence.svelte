<script lang="ts">
	/**
	 * A sentence with case colours (X-ray). Annotated words are buttons: tapping one shows
	 * its role and case. Each coloured span also carries its N/A/D/G letter, so colour is
	 * never the only signal.
	 */
	import type { XraySpan } from '#lib/engine/content/schema.js';
	import { describeSpan, xraySegments } from '#lib/engine/content/xray.js';

	let { text, spans }: { text: string; spans: XraySpan[] } = $props();
	const segments = $derived(xraySegments(text, spans));
	let open = $state<number | undefined>();

	const caseClass = {
		nom: 'decoration-case-nom text-case-nom',
		akk: 'decoration-case-akk text-case-akk',
		dat: 'decoration-case-dat text-case-dat',
		gen: 'decoration-case-gen text-case-gen'
	} as const;
	const letter = { nom: 'N', akk: 'A', dat: 'D', gen: 'G' } as const;
</script>

<span class="leading-loose">
	{#each segments as segment, i (i)}
		{#if segment.span}
			{@const s = segment.span}
			<button
				type="button"
				class="rounded px-0.5 font-semibold underline decoration-2 underline-offset-4 {s.case
					? caseClass[s.case]
					: 'decoration-muted'}"
				aria-expanded={open === i}
				aria-label={`${segment.text}: ${describeSpan(s)}`}
				onclick={() => (open = open === i ? undefined : i)}
			>
				{segment.text}{#if s.case}<sup class="ml-0.5 text-[0.6em] font-bold" aria-hidden="true"
						>{letter[s.case]}</sup
					>{/if}
			</button>
		{:else}{segment.text}{/if}
	{/each}
</span>
{#if open !== undefined && segments[open]?.span}
	<span
		class="mt-1 block rounded-lg bg-surface-2 px-3 py-2 text-sm"
		role="status"
		data-testid="xray-info"
	>
		<strong>{segments[open]?.text}</strong>: {describeSpan(segments[open]!.span!)}
	</span>
{/if}
