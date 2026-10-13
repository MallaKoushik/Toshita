# Toshita Birthday

A static birthday experience built with Vite and Three.js. The WebGL scene, reveal animations, keyboard and touch photo viewer, and celebration confetti run entirely in the browser.

## Add photos

Put any number of `.jpg`, `.jpeg`, `.png`, or `.webp` images in `photos/`. Vite discovers and bundles these files automatically; filenames determine their gallery order. The gallery uses natural image proportions and includes every supported image. Captions are configured in `src/main.js` in the `caption` list. If there are no photos, the page shows instructions instead of broken placeholders.

The hero shows October 14, 2026 and a live countdown to midnight India time for Toshita's 19th birthday. The countdown ends when the birthday begins.

## Run locally

Install Node.js 20.19+ or 22.12+, then run:

```sh
npm install
npm run dev
```

## Build and publish

```sh
npm run build
npm run preview
```

The static site is emitted to `dist/`. For GitHub Pages, deploy the contents of `dist/` using GitHub Actions or a Pages deployment action. Vite uses relative asset URLs so the site also works at a repository subpath.

The Google Fonts link is optional; local serif and script fallbacks are included. Three.js and the website itself are bundled locally.
