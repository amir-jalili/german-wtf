<script lang="ts" generics="T extends string | number">
	/** A row of radio buttons (big touch targets) for a small set of choices. */
	let {
		labelledby,
		options,
		selected,
		onselect,
		testid
	}: {
		labelledby: string;
		options: readonly { value: T; label: string }[];
		selected: T;
		onselect: (value: T) => void;
		testid?: string;
	} = $props();
</script>

<div
	role="radiogroup"
	aria-labelledby={labelledby}
	class="grid gap-2"
	style="grid-template-columns: repeat({options.length}, minmax(0, 1fr));"
	data-testid={testid}
>
	{#each options as option (option.value)}
		{@const isSelected = option.value === selected}
		<button
			type="button"
			role="radio"
			aria-checked={isSelected}
			class="tap rounded-xl border-2 px-2 py-2 font-semibold {isSelected
				? 'border-accent bg-accent-soft'
				: 'border-border'}"
			onclick={() => onselect(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
