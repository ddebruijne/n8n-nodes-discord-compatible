import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'nodes');
const target = join(root, 'dist', 'nodes');

if (!existsSync(target)) {
	mkdirSync(target, { recursive: true });
}

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});

let copied = 0;
for (const file of walk(source)) {
	if (!/\.(svg|png)$/i.test(file)) continue;
	const dest = join(target, relative(source, file));
	mkdirSync(dirname(dest), { recursive: true });
	cpSync(file, dest);
	copied += 1;
}

console.log(`Copied ${copied} icon file(s) to dist/nodes`);
