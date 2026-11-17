<script lang="ts">
	/**
	 * Dativ, the deadpan cat (THEME_AND_FUN.md §1). Original inline SVG: one shared head,
	 * per-mood eyes and body. Fixed fur colours (a ginger cat is ginger in dark mode too).
	 */
	import { MASCOT_NAME, MOOD_LABELS, toMood, type Mood } from './mascot.js';

	let {
		mood: moodProp = 'loaf',
		size = 120,
		decorative = false
	}: { mood?: Mood | string; size?: number; decorative?: boolean } = $props();

	const mood = $derived(toMood(moodProp));
	const label = $derived(`${MASCOT_NAME} the cat, ${MOOD_LABELS[mood]}`);

	const INK = '#2a2118';
	const FUR = '#e8843a';
	const STRIPE = '#b85a1c';
	const CREAM = '#fde6c8';
	const PINK = '#f2a8a0';

	type Eyes = 'open' | 'half' | 'closed' | 'smug' | 'teary' | 'judging';
</script>

{#snippet head(eyes: Eyes)}
	<!-- ears -->
	<path
		d="M -38 -12 L -34 -58 L -6 -34 Z M 38 -12 L 34 -58 L 6 -34 Z"
		fill={FUR}
		stroke={INK}
		stroke-width="3"
		stroke-linejoin="round"
	/>
	<path d="M -31 -22 L -30 -47 L -14 -34 Z M 31 -22 L 30 -47 L 14 -34 Z" fill={PINK} />
	<!-- face -->
	<ellipse cx="0" cy="0" rx="44" ry="36" fill={FUR} stroke={INK} stroke-width="3" />
	<path
		d="M -9 -35 L -6 -24 M 0 -36 L 0 -24 M 9 -35 L 6 -24"
		stroke={STRIPE}
		stroke-width="3"
		stroke-linecap="round"
	/>
	<ellipse cx="0" cy="15" rx="18" ry="12" fill={CREAM} />
	<path d="M -5 7 L 5 7 L 0 12 Z" fill="#d9706a" />
	<path
		d="M 0 12 Q -5 19 -10 16 M 0 12 Q 5 19 10 16"
		stroke={INK}
		stroke-width="2"
		fill="none"
		stroke-linecap="round"
	/>
	<path
		d="M -19 12 L -50 7 M -19 16 L -50 19 M 19 12 L 50 7 M 19 16 L 50 19"
		stroke={INK}
		stroke-width="1.5"
		stroke-linecap="round"
	/>
	<!-- eyes -->
	{#each [-1, 1] as side (side)}
		{@const x = 16 * side}
		{#if eyes === 'open'}
			<circle cx={x} cy="-6" r="6" fill={INK} />
			<circle cx={x + 2} cy="-8" r="2" fill="#fff" />
		{:else if eyes === 'half'}
			<ellipse cx={x} cy="-5" rx="7" ry="3.5" fill={INK} />
			<path d="M {x - 8} -9 L {x + 8} -9" stroke={INK} stroke-width="2.5" stroke-linecap="round" />
		{:else if eyes === 'closed'}
			<path
				d="M {x - 7} -6 Q {x} 0 {x + 7} -6"
				stroke={INK}
				stroke-width="2.5"
				fill="none"
				stroke-linecap="round"
			/>
		{:else if eyes === 'smug'}
			<ellipse cx={x} cy="-4" rx="7" ry="3" fill={INK} />
			<path
				d="M {x - 9 * side} -7 L {x + 9 * side} -11"
				stroke={INK}
				stroke-width="2.5"
				stroke-linecap="round"
			/>
		{:else if eyes === 'teary'}
			<circle cx={x} cy="-6" r="9" fill={INK} />
			<circle cx={x + 3} cy="-9" r="3" fill="#fff" />
			<circle cx={x - 3} cy="-3" r="1.5" fill="#fff" />
			<path d="M {x} 4 q -4 7 0 10 q 4 -3 0 -10 Z" fill="#7cc4f2" stroke={INK} stroke-width="1" />
		{:else}
			<ellipse cx={x} cy="-4" rx="7" ry="1.8" fill={INK} />
			<path
				d="M {x + 9 * side} -15 L {x - 7 * side} -10"
				stroke={INK}
				stroke-width="2.5"
				stroke-linecap="round"
			/>
		{/if}
	{/each}
{/snippet}

{#snippet tail(d: string)}
	<path {d} stroke={INK} stroke-width="16" fill="none" stroke-linecap="round" />
	<path {d} stroke={FUR} stroke-width="10" fill="none" stroke-linecap="round" />
{/snippet}

{#snippet sittingBody()}
	{@render tail('M 128 146 Q 168 142 160 104')}
	<path
		d="M 66 150 Q 58 98 100 92 Q 142 98 134 150 Z"
		fill={FUR}
		stroke={INK}
		stroke-width="3"
		stroke-linejoin="round"
	/>
	<ellipse cx="100" cy="125" rx="17" ry="20" fill={CREAM} />
	<ellipse cx="86" cy="150" rx="11" ry="7" fill={CREAM} stroke={INK} stroke-width="2.5" />
	<ellipse cx="114" cy="150" rx="11" ry="7" fill={CREAM} stroke={INK} stroke-width="2.5" />
{/snippet}

<svg
	viewBox="0 0 200 165"
	width={size}
	height={size * 0.825}
	role={decorative ? undefined : 'img'}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : label}
	data-mood={mood}
	class="inline-block overflow-visible"
>
	{#if mood === 'loaf'}
		{@render tail('M 152 140 Q 172 150 140 156 L 80 156')}
		<rect x="38" y="84" width="124" height="66" rx="33" fill={FUR} stroke={INK} stroke-width="3" />
		<path
			d="M 128 92 L 124 104 M 140 98 L 134 108 M 60 98 L 66 108"
			stroke={STRIPE}
			stroke-width="3"
			stroke-linecap="round"
		/>
		<g transform="translate(100 80) scale(0.9)">{@render head('half')}</g>
	{:else if mood === 'smug'}
		{@render sittingBody()}
		<g transform="translate(100 66) scale(0.95)">{@render head('smug')}</g>
	{:else if mood === 'judging'}
		{@render sittingBody()}
		<g transform="translate(100 66) rotate(-6) scale(0.95)">{@render head('judging')}</g>
	{:else if mood === 'crying-thumbs-up'}
		{@render sittingBody()}
		{@render tail('M 126 122 Q 150 112 154 92')}
		<circle cx="154" cy="86" r="12" fill={FUR} stroke={INK} stroke-width="3" />
		<ellipse cx="155" cy="68" rx="5.5" ry="10" fill={FUR} stroke={INK} stroke-width="3" />
		<g transform="translate(96 64) scale(1.02)">{@render head('teary')}</g>
	{:else if mood === 'sleeping'}
		{@render tail('M 168 118 Q 166 152 104 152 Q 62 152 50 138')}
		<ellipse cx="108" cy="116" rx="68" ry="38" fill={FUR} stroke={INK} stroke-width="3" />
		<path
			d="M 120 82 L 116 96 M 136 86 L 130 98 M 150 94 L 142 104"
			stroke={STRIPE}
			stroke-width="3"
			stroke-linecap="round"
		/>
		<g transform="translate(70 112) rotate(-12) scale(0.72)">{@render head('closed')}</g>
		<text
			x="130"
			y="58"
			font-size="20"
			font-weight="700"
			fill="#8a7a68"
			font-family="system-ui, sans-serif">z</text
		>
		<text
			x="148"
			y="42"
			font-size="26"
			font-weight="700"
			fill="#8a7a68"
			font-family="system-ui, sans-serif">Z</text
		>
	{:else if mood === 'flat-on-keyboard'}
		<rect
			x="18"
			y="122"
			width="164"
			height="34"
			rx="6"
			fill="#d9d4cc"
			stroke={INK}
			stroke-width="3"
		/>
		{#each [0, 1] as row (row)}
			{#each Array.from({ length: 11 }, (_, i) => i) as col (col)}
				<rect
					x={26 + col * 14}
					y={128 + row * 12}
					width="10"
					height="8"
					rx="2"
					fill="#f4f1ec"
					stroke="#8a7a68"
					stroke-width="1"
				/>
			{/each}
		{/each}
		{@render tail('M 176 118 Q 196 124 188 146')}
		<ellipse cx="44" cy="126" rx="12" ry="6" fill={FUR} stroke={INK} stroke-width="2.5" />
		<ellipse cx="166" cy="126" rx="12" ry="6" fill={FUR} stroke={INK} stroke-width="2.5" />
		<ellipse cx="108" cy="116" rx="74" ry="17" fill={FUR} stroke={INK} stroke-width="3" />
		<path
			d="M 110 102 L 108 112 M 126 102 L 122 112 M 142 104 L 136 113"
			stroke={STRIPE}
			stroke-width="3"
			stroke-linecap="round"
		/>
		<g transform="translate(52 104) scale(0.72 0.6)">{@render head('half')}</g>
	{:else if mood === 'box'}
		<g transform="translate(100 88) scale(0.85)">{@render head('open')}</g>
		<path
			d="M 40 100 L 18 84 L 58 84 Z M 160 100 L 182 84 L 142 84 Z"
			fill="#b98352"
			stroke={INK}
			stroke-width="3"
			stroke-linejoin="round"
		/>
		<rect x="40" y="100" width="120" height="56" fill="#c8955f" stroke={INK} stroke-width="3" />
		<path d="M 70 118 L 130 118" stroke="#8f6237" stroke-width="3" stroke-dasharray="6 6" />
	{/if}
</svg>
