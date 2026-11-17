<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { navigating } from '$app/state';
	import TailSpinner from '#lib/ui/fun/TailSpinner.svelte';
	import { pwa } from '#lib/pwa/register.svelte.js';
	import BottomNav from '#lib/ui/common/BottomNav.svelte';
	import ErrorPanel from '#lib/ui/common/ErrorPanel.svelte';
	import UpdateToast from '#lib/ui/common/UpdateToast.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => pwa.register());
</script>

<div class="md:flex md:min-h-dvh">
	<BottomNav />
	<!-- Bottom padding = nav height + home-indicator inset + breathing room (phones only). -->
	<main
		class="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-[calc(var(--nav-h)+var(--safe-bottom)+1.5rem)] md:pb-8"
	>
		{#if navigating.to}
			<div class="fixed top-3 right-3 z-50"><TailSpinner /></div>
		{/if}
		<svelte:boundary>
			{@render children()}
			{#snippet failed(error, reset)}
				<ErrorPanel {error} {reset} />
			{/snippet}
		</svelte:boundary>
	</main>
	<UpdateToast />
</div>
