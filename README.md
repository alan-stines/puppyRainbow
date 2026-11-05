# PuppyRainbow

A cheerful, interactive static website for dog photos, original fictional stories, and playful breaks with Rainbow the puppy.

## Included

- Twenty credited dog photos, twenty-two fictional tales, and ten little-joy prompts.
- Fixed navigation and a responsive mobile menu.
- Gallery filters, shuffling, photo lightboxes, and browser-local favorites.
- Searchable stories, a reader dialog, and browser-local reading history.
- A four-outcome dog personality quiz and twelve no-repeat-in-a-row puppy fortunes on the homepage.
- Four additional original fictional stories connected to gallery photos.
- An animated SVG puppy with head pats, fetch, and pretend treats. Captions and visual feedback work without sound. Sound is optional and starts off.
- Keyboard-accessible dialogs, reduced-motion styles, and phone-friendly controls.
- Locally hosted photos, fonts, scripts, and content; no runtime CDN or third-party API dependency.

## Run and check

Serve the repository with any static HTTP server, for example `python -m http.server 8000`, then open http://localhost:8000. A server is needed because the site loads local JSON and SVG assets with fetch.

Run `node --check app.js`, `node --check extras.js`, and `node check.mjs` for content and asset checks. No dependency installation or build step is needed.

Edit content.json to update stories and photo metadata. Photography lives under assets. The gallery.html, blog.html, community.html, resources.html, and shop.html paths remain as compatibility redirects. Existing blog story anchors open the matching story reader.

Favorites and reading history stay in the visitor's browser. Private access is enforced by the hosting service; this static front end does not implement authentication. GitHub Pages is public. Pushing this upgrade to its separate branch does not replace the version on main.

## Credits and source

This upgrade builds on alan-stines/puppyRainbow at main commit a50210742e805e42682158306e6e8ec6dc5a0fdd. It retains the original sixteen photo selections, twelve stories, and Rainbow's SVG character, adding four photos and ten stories in total, including four from the latest expansion.

All tales and dog character names are fictional. Photo credits appear in the website's Photo credits dialog and in content.json. DM Sans is distributed with its OFL license in assets/DM-Sans-OFL.txt.

See QA.md for browser checks and verification limits.
