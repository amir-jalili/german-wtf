<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.js';
	import { APP_VERSION } from '#lib/version.js';
</script>

<svelte:head><title>{t('settings.title')} · {t('app.name')}</title></svelte:head>

<h1 class="text-2xl font-bold">{t('settings.title')}</h1>
<dl class="card mt-4 text-sm">
	<div class="flex justify-between">
		<dt class="text-muted">{t('settings.version')}</dt>
		<dd data-testid="app-version">{APP_VERSION}</dd>
	</div>
</dl>
