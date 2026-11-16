<script lang="ts">
	import { page } from '$app/state';
	import ErrorPanel from '#lib/ui/common/ErrorPanel.svelte';

	const error = $derived(
		page.error ? new Error(`${page.status}: ${page.error.message}`) : new Error(String(page.status))
	);
</script>

<ErrorPanel {error} />
