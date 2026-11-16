<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.js';
</script>

<svelte:head><title>{t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('today.title')}</h1>
<p class="mt-2 text-muted">{t('today.empty')}</p>
