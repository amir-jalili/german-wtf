<script lang="ts">
	/**
	 * Primary navigation: a thumb-reachable bottom bar on phones, a side rail on desktop.
	 * Five destinations (PRODUCT_SPEC §5): Today · Map · Mistakes · Stats · Settings.
	 */
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t } from '#lib/i18n/index.svelte.js';
	import type { MessageKey } from '#lib/i18n/messages.js';

	type Item = {
		href: '/' | '/map' | '/mistakes' | '/stats' | '/settings';
		key: MessageKey;
		icon: string;
	};
	const items: Item[] = [
		{ href: '/', key: 'nav.today', icon: 'M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3z' },
		{ href: '/map', key: 'nav.map', icon: 'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16' },
		{
			href: '/mistakes',
			key: 'nav.mistakes',
			icon: 'M12 4a8 8 0 100 16 8 8 0 000-16zm0 4v5m0 3h.01'
		},
		{ href: '/stats', key: 'nav.stats', icon: 'M4 20V10m6 10V4m6 16v-7m4 7H2' },
		{
			href: '/settings',
			key: 'nav.settings',
			icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8 4l-2 .5-.5 1.5 1.3 1.6-1.6 1.6-1.6-1.3-1.5.5L13 20h-2l-.5-2-1.5-.5-1.6 1.3-1.6-1.6 1.3-1.6-.5-1.5L4 12l2-.5.5-1.5L5.2 8.4l1.6-1.6 1.6 1.3 1.5-.5L11 4h2l.5 2 1.5.5 1.6-1.3 1.6 1.6-1.3 1.6.5 1.5z'
		}
	];

	function isCurrent(href: string): boolean {
		const path = page.url.pathname.replace(/\/$/, '') || '/';
		const target = resolve(href as '/').replace(/\/$/, '') || '/';
		return href === '/' ? path === target : path === target || path.startsWith(`${target}/`);
	}
</script>

<nav
	aria-label="Main"
	class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-(--safe-bottom) md:sticky md:top-0 md:h-screen md:w-56 md:border-t-0 md:border-r md:pb-0"
>
	<ul class="flex h-(--nav-h) justify-around md:h-auto md:flex-col md:gap-1 md:p-3">
		{#each items as item (item.href)}
			{@const current = isCurrent(item.href)}
			<li class="flex-1 md:flex-none">
				<a
					href={resolve(item.href)}
					aria-current={current ? 'page' : undefined}
					class="flex tap flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-sm {current
						? 'text-accent md:bg-accent-soft'
						: 'text-muted hover:text-text'}"
				>
					<span class="relative">
						{#if current}
							<!-- cat ears on the active tab (THEME_AND_FUN.md §1) -->
							<svg
								class="absolute -top-2.5 left-1/2 h-3 w-7 -translate-x-1/2"
								viewBox="0 0 28 12"
								aria-hidden="true"
								data-testid="nav-ears"
							>
								<path d="M 3 12 L 6 1 L 12 8 Z M 25 12 L 22 1 L 16 8 Z" fill="currentColor" />
							</svg>
						{/if}
						<svg
							class="h-6 w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d={item.icon} />
						</svg>
					</span>
					<span>{t(item.key)}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
