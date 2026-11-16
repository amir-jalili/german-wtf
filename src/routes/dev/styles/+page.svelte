<script lang="ts">
	/** Style guide: tokens, badges and buttons in the current colour scheme. Dev only, unlisted. */
	import CaseBadge from '#lib/ui/common/CaseBadge.svelte';
	const cases = ['nom', 'akk', 'dat', 'gen'] as const;
</script>

<h1 class="text-2xl font-bold">Style guide</h1>

<h2 class="mt-6 text-lg font-semibold">Case colours</h2>
<ul class="mt-2 flex flex-wrap gap-3">
	{#each cases as c (c)}
		<li class="card flex items-center gap-2">
			<CaseBadge kase={c} size="md" /> <span class="text-case-{c} font-semibold">der {c}</span>
		</li>
	{/each}
</ul>

<h2 class="mt-6 text-lg font-semibold">Buttons</h2>
<div class="mt-2 flex flex-wrap gap-2">
	<button type="button" class="btn-primary">Primary</button>
	<button type="button" class="btn-secondary">Secondary</button>
</div>

<h2 class="mt-6 text-lg font-semibold">Feedback colours</h2>
<div class="mt-2 flex gap-4 font-semibold">
	<span class="text-success">✅ correct</span>
	<span class="text-warn">🟡 almost</span>
	<span class="text-danger">❌ wrong</span>
</div>
