<script lang="ts">
	/** Lesson for one grammar point (P1.6): summary, rule, table, x-rayed examples, pitfalls. */
	import { resolve } from '$app/paths';
	import Md from '#lib/ui/common/Md.svelte';
	import PlayButton from '#lib/ui/common/PlayButton.svelte';
	import ParadigmTable from '#lib/ui/lesson/ParadigmTable.svelte';
	import XraySentence from '#lib/ui/lesson/XraySentence.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const point = $derived(data.point);
	const lesson = $derived(point.lesson);
</script>

<svelte:head><title>{point.title.de} · German WTF</title></svelte:head>

<article class="space-y-6 pb-20">
	<header>
		<p class="text-xs tracking-wide text-muted uppercase">{point.level} · {point.family}</p>
		<h1 class="text-2xl font-bold">{point.title.de}</h1>
		<p class="text-muted">{point.title.en}</p>
		<p class="mt-3 text-lg"><Md text={lesson.summary} /></p>
	</header>

	<section aria-labelledby="rule-h">
		<h2 id="rule-h" class="mb-2 text-lg font-semibold">The rule</h2>
		<Md text={lesson.rule} block />
	</section>

	{#if lesson.table}
		<section aria-labelledby="table-h">
			<h2 id="table-h" class="mb-2 text-lg font-semibold">Table</h2>
			<ParadigmTable columns={lesson.table.columns} rows={lesson.table.rows} />
		</section>
	{/if}

	<section aria-labelledby="ex-h">
		<h2 id="ex-h" class="mb-1 text-lg font-semibold">Examples</h2>
		<p class="mb-3 text-sm text-muted">Tap a coloured word to see its role and case.</p>
		<ul class="space-y-3">
			{#each lesson.examples as example (example.de)}
				<li class="card">
					<div class="flex items-start justify-between gap-2">
						<p class="text-lg"><XraySentence text={example.de} spans={example.xray} /></p>
						<PlayButton text={example.de} size="sm" />
					</div>
					<p class="text-sm text-muted">{example.en}</p>
				</li>
			{/each}
		</ul>
	</section>

	{#if lesson.pitfalls.length}
		<section aria-labelledby="pit-h">
			<h2 id="pit-h" class="mb-2 text-lg font-semibold">Watch out</h2>
			<ul class="list-disc space-y-1 pl-5">
				{#each lesson.pitfalls as pitfall (pitfall)}
					<li><Md text={pitfall} /></li>
				{/each}
			</ul>
		</section>
	{/if}

	<div
		class="sticky bottom-[calc(var(--nav-h)+var(--safe-bottom))] z-30 -mx-4 bg-bg/90 px-4 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0"
	>
		<a class="btn-primary w-full md:w-auto" href={resolve('/practice/[id]', { id: point.id })}>
			Practise ({point.items.length} exercises)
		</a>
	</div>
</article>
