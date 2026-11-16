<script lang="ts">
	/**
	 * Exercises the root error boundary (tests/e2e/shell.e2e.ts): the button sets state
	 * and the effect throws during the next render, which <svelte:boundary> catches.
	 */
	let crash = $state(false);

	$effect(() => {
		if (crash) throw new Error('Test crash from /dev/crash');
	});
</script>

<h1 class="text-2xl font-bold">Crash test</h1>
<button type="button" class="btn-secondary mt-4" onclick={() => (crash = true)}>Crash now</button>
