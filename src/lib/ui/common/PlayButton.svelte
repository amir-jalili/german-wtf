<script lang="ts">
	/** Speaker button: reads a German sentence aloud with the browser's TTS. */
	import { onMount } from 'svelte';
	import { canSpeak, speak } from '#lib/audio/tts.js';

	let { text, size = 'md' }: { text: string; size?: 'sm' | 'md' } = $props();
	let supported = $state(true);
	onMount(() => (supported = canSpeak()));
</script>

{#if supported}
	<button
		type="button"
		class="inline-flex tap items-center justify-center rounded-full text-muted hover:text-accent"
		aria-label="Play audio"
		title="Play audio"
		onclick={() => speak(text)}
	>
		<svg
			class={size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 010 7M19 5.5a9 9 0 010 13" />
		</svg>
	</button>
{/if}
