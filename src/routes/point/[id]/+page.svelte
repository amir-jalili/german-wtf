<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const point = $derived(data.point);
</script>

<svelte:head><title>{point.title.en} · Grammatik Gym</title></svelte:head>

<h1 class="text-2xl font-bold">{point.title.de}</h1>
<p class="text-muted">{point.title.en}</p>
