<script lang="ts">
	/** Lesson table; rows whose label names a case get the case colour and letter badge. */
	import { caseOfLabel } from '#lib/engine/content/xray.js';
	import CaseBadge from '#lib/ui/common/CaseBadge.svelte';

	let { columns, rows }: { columns: string[]; rows: Record<string, string[]> } = $props();
	const genderLabel: Record<string, string> = {
		m: 'masc. (der)',
		f: 'fem. (die)',
		n: 'neut. (das)',
		pl: 'plural'
	};
</script>

<div class="-mx-4 overflow-x-auto px-4">
	<table class="w-full min-w-[30rem] border-collapse text-sm">
		<thead>
			<tr>
				<th class="p-2 text-left" scope="col"><span class="sr-only">Case</span></th>
				{#each columns as col (col)}
					<th class="p-2 text-left font-medium text-muted" scope="col">{genderLabel[col] ?? col}</th
					>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(rows) as [label, cells] (label)}
				{@const kase = caseOfLabel(label)}
				<tr class="border-t border-border">
					<th class="p-2 text-left font-medium whitespace-nowrap" scope="row">
						<span class="inline-flex items-center gap-1.5">
							{#if kase}<CaseBadge {kase} />{/if}
							{label}
						</span>
					</th>
					{#each cells as cell, i (i)}
						<td class="p-2 whitespace-nowrap">{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
