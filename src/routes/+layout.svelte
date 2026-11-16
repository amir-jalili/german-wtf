<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { pwa } from '#lib/pwa/register.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => pwa.register());
</script>

{@render children()}
