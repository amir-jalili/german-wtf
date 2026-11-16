/**
 * Static server for the production build that behaves like GitHub Pages:
 * - serves `build/` (or the given directory) under BASE_PATH (default: root);
 * - `/x` serves `x.html`; a directory serves its `index.html`;
 * - unknown paths get `404.html` with status 404 (the SPA fallback), so deep links work;
 * - `/404.html` itself is served with 200, so the service worker can precache it.
 *
 * Usage: tsx scripts/serve.ts [dir] [--port 4173]
 * Used by `pnpm preview` and by Playwright (playwright.config.ts).
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const MIME: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain; charset=utf-8',
	'.map': 'application/json; charset=utf-8'
};

const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const port = portFlag >= 0 ? Number(args[portFlag + 1]) : 4173;
const dir = args.find((a, i) => !a.startsWith('--') && i !== portFlag + 1) ?? 'build';
const root = path.resolve(dir);
const base = process.env.BASE_PATH ?? '';

async function fileIfExists(file: string): Promise<string | undefined> {
	try {
		const s = await stat(file);
		if (s.isFile()) return file;
		if (s.isDirectory()) return fileIfExists(path.join(file, 'index.html'));
	} catch {
		/* not found */
	}
	return undefined;
}

async function resolveFile(urlPath: string): Promise<{ file: string; status: number } | undefined> {
	const rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
	const candidate = path.resolve(root, rel);
	if (!candidate.startsWith(root)) return undefined; // path traversal
	const direct = await fileIfExists(candidate);
	if (direct) return { file: direct, status: 200 };
	const withHtml = await fileIfExists(`${candidate}.html`);
	if (withHtml) return { file: withHtml, status: 200 };
	const fallback = await fileIfExists(path.join(root, '404.html'));
	return fallback ? { file: fallback, status: 404 } : undefined;
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
	const url = new URL(req.url ?? '/', 'http://localhost');
	let pathname = url.pathname;
	if (base) {
		if (pathname === base) {
			res.writeHead(301, { location: `${base}/` });
			res.end();
			return;
		}
		if (!pathname.startsWith(`${base}/`)) {
			res.writeHead(404, { 'content-type': 'text/plain' });
			res.end('Not found (outside BASE_PATH)');
			return;
		}
		pathname = pathname.slice(base.length);
	}
	const hit = await resolveFile(pathname);
	if (!hit) {
		res.writeHead(404, { 'content-type': 'text/plain' });
		res.end('Not found');
		return;
	}
	const ext = path.extname(hit.file);
	const immutable = hit.file.includes(`${path.sep}_app${path.sep}immutable${path.sep}`);
	res.writeHead(hit.status, {
		'content-type': MIME[ext] ?? 'application/octet-stream',
		'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache'
	});
	res.end(await readFile(hit.file));
}

createServer((req, res) => {
	handle(req, res).catch((error: unknown) => {
		console.error(error);
		res.writeHead(500);
		res.end('Server error');
	});
}).listen(port, () => {
	console.log(`Serving ${root} at http://localhost:${port}${base}/`);
});
