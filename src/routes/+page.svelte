<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n/index.svelte.js';
	import Mascot from '#lib/ui/fun/Mascot.svelte';
</script>

<svelte:head><title>{t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('today.title')}</h1>
<div class="mt-4 flex flex-col items-center gap-2 text-center">
	<Mascot mood="loaf" size={160} />
	<p class="text-lg font-bold text-accent" data-testid="tagline">{t('app.tagline')}</p>
	<p class="max-w-xs text-muted">{t('today.empty')}</p>
	<a class="btn-primary mt-2" href={resolve('/map')}>{t('today.toMap')}</a>
</div>
