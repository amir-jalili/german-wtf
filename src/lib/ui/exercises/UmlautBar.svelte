<script lang="ts">
	/**
	 * ä ö ü ß buttons above the keyboard (PRODUCT_SPEC §4). Inserts the character at the
	 * caret of the last focused text input and keeps the focus there.
	 */
	let { target }: { target: HTMLInputElement | undefined } = $props();
	let upper = $state(false);

	const letters = $derived(upper ? ['Ä', 'Ö', 'Ü', 'ẞ'] : ['ä', 'ö', 'ü', 'ß']);

	function insert(char: string): void {
		const input = target;
		if (!input) return;
		const start = input.selectionStart ?? input.value.length;
		const end = input.selectionEnd ?? start;
		input.setRangeText(char, start, end, 'end');
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.focus();
		upper = false;
	}
</script>

<div class="flex gap-2" role="toolbar" aria-label="Special characters">
	{#each letters as letter (letter)}
		<button
			type="button"
			class="btn-secondary min-w-11 px-0 text-lg"
			onmousedown={(e) => e.preventDefault()}
			onclick={() => insert(letter)}
			aria-label={`Insert ${letter}`}
		>
			{letter}
		</button>
	{/each}
	<button
		type="button"
		class="btn-secondary min-w-11 px-0 {upper ? 'ring-2 ring-accent' : ''}"
		onmousedown={(e) => e.preventDefault()}
		onclick={() => (upper = !upper)}
		aria-pressed={upper}
		aria-label="Upper case"
	>
		⇧
	</button>
</div>
