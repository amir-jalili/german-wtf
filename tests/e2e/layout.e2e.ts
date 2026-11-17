import { expect, test } from '@playwright/test';

/**
 * Bug: on iPhone the bottom nav covered the end of scrollable pages (the lesson's
 * "Practise" button was half hidden). Chromium has no home indicator, so the test fakes
 * iPhone's 34 px safe-area inset through the `--safe-bottom` token the layout uses.
 */
const pages = [
	'/',
	'/map',
	'/mistakes',
	'/stats',
	'/settings',
	'/point/accusative-articles',
	'/point/dative-articles',
	'/practice/dative-articles'
];

test.use({ viewport: { width: 375, height: 667 } });

for (const path of pages) {
	test(`last element of ${path} is fully visible above the nav`, async ({ page }) => {
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.evaluate(() => document.documentElement.style.setProperty('--safe-bottom', '34px'));
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		await page.waitForTimeout(100);
		const { lowest, navTop, viewport } = await page.evaluate(() => {
			const nav = document.querySelector('nav[aria-label="Main"]')!.getBoundingClientRect();
			let lowest = { bottom: 0, what: '' };
			for (const el of document.querySelectorAll('main *')) {
				const r = el.getBoundingClientRect();
				if (r.width === 0 || r.height === 0) continue;
				if (r.bottom > lowest.bottom) {
					lowest = {
						bottom: r.bottom,
						what: `${el.tagName} ${el.textContent?.trim().slice(0, 40)}`
					};
				}
			}
			return { lowest, navTop: nav.top, viewport: window.innerHeight };
		});
		expect(navTop, 'nav sits at the bottom on phones').toBeLessThan(viewport);
		expect(lowest.bottom, `"${lowest.what}" is hidden behind the nav`).toBeLessThanOrEqual(navTop);
	});
}

test('lesson Practise button stays fully visible above the nav while scrolling', async ({
	page
}) => {
	await page.goto('/point/dative-articles');
	await page.evaluate(() => document.documentElement.style.setProperty('--safe-bottom', '34px'));
	const button = page.getByRole('link', { name: /^Practise \(\d+ exercises\)$/ });
	await expect(button).toBeVisible();
	for (const y of [0, 600]) {
		await page.evaluate((top) => window.scrollTo(0, top), y);
		await page.waitForTimeout(100);
		const box = (await button.boundingBox())!;
		const nav = (await page.getByRole('navigation', { name: 'Main' }).boundingBox())!;
		expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
		expect(box.y).toBeGreaterThanOrEqual(0);
	}
});
