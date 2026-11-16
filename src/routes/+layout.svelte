<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { pwa } from '#lib/pwa/register.svelte.js';
	import BottomNav from '#lib/ui/common/BottomNav.svelte';
	import ErrorPanel from '#lib/ui/common/ErrorPanel.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => pwa.register());
</script>

<div class="md:flex md:min-h-dvh">
	<BottomNav />
	<!-- Bottom padding keeps content clear of the fixed nav on phones. -->
	<main class="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-24 md:pb-8">
		<svelte:boundary>
			{@render children()}
			{#snippet failed(error, reset)}
				<ErrorPanel {error} {reset} />
			{/snippet}
		</svelte:boundary>
	</main>
</div>
