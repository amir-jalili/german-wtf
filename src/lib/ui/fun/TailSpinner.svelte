<script lang="ts">
	/** A cat tail swishing in a circle; the loading indicator (THEME_AND_FUN.md §1). */
	let { label = 'Loading' }: { label?: string } = $props();
</script>

<span class="inline-flex items-center gap-2" role="status" aria-live="polite">
	<svg viewBox="0 0 40 40" class="tail-spin h-8 w-8 text-accent" aria-hidden="true">
		<path
			d="M 20 34 C 8 34 6 22 12 16 C 18 10 28 12 30 6"
			fill="none"
			stroke="currentColor"
			stroke-width="5"
			stroke-linecap="round"
		/>
		<circle cx="30" cy="6" r="3.5" fill="currentColor" />
	</svg>
	<span class="sr-only">{label}</span>
</span>

<style>
	.tail-spin {
		animation: tail-spin 1.1s ease-in-out infinite;
		transform-origin: 50% 85%;
	}
	@keyframes tail-spin {
		0%,
		100% {
			transform: rotate(-35deg);
		}
		50% {
			transform: rotate(35deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tail-spin {
			animation: none;
		}
	}
</style>
