# DefineAI marketing site (no build tooling)

Static single-page marketing site for DefineAI, built with plain HTML/CSS/vanilla JS and ready for GitHub Pages.

## Logo placement

- Nav wordmark uses `assets/img/logo_white_long.png`.
- Footer logo uses `assets/img/logo_white_long.png`.
- Favicon uses `assets/img/favicon.ico`.

## Local test

From repo root:

```bash
python3 -m http.server 8080
```

Then open:

- http://127.0.0.1:8080/

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Save and wait for the first deployment.

Published URL will be either:

- `https://<username>.github.io/` (user/org site repo named `<username>.github.io`)
- `https://<username>.github.io/<repo-name>/` (project site)

## Publish checklist

- Replace canonical/OG placeholders in [index.html](index.html).
- Replace Formspree `FORM_ID` in [index.html](index.html).
- Update site URL in [robots.txt](robots.txt) and [sitemap.xml](sitemap.xml).
- If using a custom domain, add `CNAME` and update canonical + sitemap URLs.

## Notes

- No npm, no bundlers, no build step required.
- Animations gracefully reduce/disable based on `prefers-reduced-motion` and visibility.
