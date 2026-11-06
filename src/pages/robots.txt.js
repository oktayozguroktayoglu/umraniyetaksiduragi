import { SITE_URL } from '../data/site.js';
export const GET = () => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`);
