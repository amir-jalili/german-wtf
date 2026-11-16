<script lang="ts">
	/**
	 * Renders our own Markdown (lesson rules, explanations). The renderer escapes all HTML
	 * before adding its own tags (src/lib/ui/markdown.ts, tested), so {@html} is safe here.
	 */
	import { inlineMarkdown, markdown } from '#lib/ui/markdown.js';

	let {
		text,
		block = false,
		class: className = ''
	}: { text: string; block?: boolean; class?: string } = $props();
	const html = $derived(block ? markdown(text) : inlineMarkdown(text));
</script>

{#if block}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- escaped by markdown() -->
	<div class="prose-gg {className}">{@html html}</div>
{:else}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- escaped by inlineMarkdown() -->
	<span class={className}>{@html html}</span>
{/if}
