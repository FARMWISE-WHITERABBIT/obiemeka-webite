# Search visibility and publishing

`npm run build` builds the client and renders every public route into HTML. Vercel serves the generated `.html` files through `cleanUrls`; there is no catch-all homepage rewrite. Unknown URLs use `404.html`. The legacy `/green-circle` URL permanently redirects to `/greencircle-community`.

The same route metadata drives the initial HTML and client navigation. Each page has its own canonical URL, description, social metadata, and schema graph. Posts include BlogPosting and BreadcrumbList data, visible author attribution, publication dates, and readable article text without JavaScript. Existing Person and WebSite identity data is preserved.

## Add a post

Add a Markdown file in `src/content/blog/` with `title`, `date` (publication date), `excerpt`, and optional `ctaTopic` and `youtube` frontmatter. `youtube` is the 11-character video ID, not the full watch URL. The player thumbnail loads first; clicking loads the privacy-enhanced YouTube iframe. A watch link remains available in the article.

Use lowercase, hyphenated filenames. The build discovers posts automatically and generates the deployed sitemap from the same collection. It does not invent modification dates or change old publication dates. The historical sitemap in `public/` is replaced in the production build.

Run `npm run build` and `npm run test:seo`. Inspect direct article URLs and navigation between the journal, articles, homepage, and community page before merging.

## Remaining work

After deployment, inspect the new and existing article URLs in Search Console and request recrawling where appropriate. Check the rendered HTML, canonical selection, sitemap processing, and performance reports. Local checks do not establish production indexing or field Core Web Vitals.

The supplied video is cited and embedded. VideoObject rich-result markup is deliberately omitted until its actual upload date and other video metadata can be verified; the article publication date is not the video's upload date.

For future articles, use direct answers, descriptive headings, original experience, relevant internal links, and primary sources for legal, regulatory, financial, or time-sensitive claims. The older EUDR checklist still needs a separate factual editorial review against current official regulations; this technical update does not validate its compliance guidance.

There is no guarantee of rankings, AI citations, or rich results. No special AI files, fabricated FAQs, credentials, ratings, or unsupported schema were added.

References:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/appearance/structured-data/video
