import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN, BASE } from './src/data/site.js';

// Alan adı bağlanmadan (github.io/umraniyetaksiduragi/) yayınlarken site içi linklerin başına BASE eklenir.
const prefixLinks = {
  name: 'prefix-links',
  hooks: {
    'astro:build:done': ({ dir }) => {
      if (!BASE) return;
      const root = fileURLToPath(dir);
      const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => {
        const p = path.join(d, f.name);
        if (f.isDirectory()) return walk(p);
        if (!p.endsWith('.html')) return;
        const html = fs.readFileSync(p, 'utf8').replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
        fs.writeFileSync(p, html);
      });
      walk(root);
    },
  },
};

export default defineConfig({
  site: SITE_ORIGIN,
  base: BASE || '/',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (p) => !p.includes('/404') }), prefixLinks],
});
