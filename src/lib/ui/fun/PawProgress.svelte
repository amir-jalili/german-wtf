<script lang="ts">
	/** Paw prints as progress dots (THEME_AND_FUN.md §1). Filled = done, outlined = to do. */
	let {
		done,
		total,
		label = 'Progress'
	}: { done: number; total: number; label?: string } = $props();
</script>

<div
	class="flex flex-wrap items-center gap-1"
	role="progressbar"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={total}
	aria-valuenow={done}
	aria-valuetext={`${done} of ${total}`}
>
	{#each Array.from({ length: total }, (_, i) => i) as i (i)}
		<svg
			viewBox="0 0 24 24"
			class="h-5 w-5 {i < done ? 'text-accent' : 'text-muted opacity-40'}"
			aria-hidden="true"
		>
			<g fill="currentColor">
				<ellipse cx="12" cy="16" rx="5.5" ry="4.5" />
				<ellipse cx="5.5" cy="10" rx="2.3" ry="3" />
				<ellipse cx="9.5" cy="6" rx="2.3" ry="3" />
				<ellipse cx="14.5" cy="6" rx="2.3" ry="3" />
				<ellipse cx="18.5" cy="10" rx="2.3" ry="3" />
			</g>
		</svg>
	{/each}
</div>
