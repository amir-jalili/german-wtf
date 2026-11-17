<script lang="ts">
	/** Dativ with a speech bubble (or a meme image) for a fun pick. */
	import { resolve } from '$app/paths';
	import type { FunPick } from '#lib/engine/fun/pick.js';
	import Mascot from './Mascot.svelte';

	let { pick, size = 96 }: { pick: FunPick; size?: number } = $props();
	const text = $derived(pick.kind === 'message' ? pick.text : undefined);
	const image = $derived(pick.kind === 'meme' ? { file: pick.file, alt: pick.alt } : pick.meme);
	const mood = $derived(pick.kind === 'message' ? pick.mood : 'smug');
</script>

<figure class="flex items-end gap-3" data-testid="fun" data-fun-id={pick.id}>
	<div class="shrink-0"><Mascot {mood} {size} decorative /></div>
	<figcaption class="relative mb-6 rounded-2xl rounded-bl-sm bg-accent-soft px-4 py-3 text-sm">
		{#if image}
			<img
				src={`${resolve('/')}fun/memes/${image.file}`}
				alt={image.alt}
				class="mb-2 max-h-48 rounded-lg"
				loading="lazy"
			/>
		{/if}
		{#if text}<p>{text}</p>{/if}
	</figcaption>
</figure>
