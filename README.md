# Usman's portfolio

Personal portfolio at https://usmanbutt.dev, built with Astro, CSS, TypeScript, Scroll Craft, and locally hosted Archivo fonts.

The homepage tells a chaptered story with calm scroll animation. `/projects/` contains 24 public projects and three approved client summaries. The current resume is `/Muhammad-Usman-Butt-Resume.pdf`.

## Development

Run `npm ci`, `npm run dev`, and `npm run build`. Production output is `dist/`. Use `npm.cmd` on PowerShell if script execution is restricted.

Homepage: `src/pages/index.astro`. Project index: `src/pages/projects/index.astro`. Styles: `src/styles/`. Promotional repository images are labelled on the site.

## Deployment

Vercel builds the `master` branch of `usmanbutt-dev/usmanbutt-portfolio`. Build command: `npm run build`. Output: `dist`. Domain DNS stays at Name.com.

Publish only reviewed source, public assets, configuration, and site checks. Private research and resume drafts stay local.

## Verification

`node scripts/check-site.mjs` checks drawing controls, overflow, browser errors, contact details, and 27 project entries on desktop/mobile and in reduced-motion/no-JavaScript modes. It uses installed Microsoft Edge. Set `SITE_URL` to check another deployment.
