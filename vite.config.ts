/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // The questions are large JSON files: load them as JSON.parse("…"), which browsers
  // parse much faster than the equivalent object literals.
  json: { stringify: true },
  // Vitest: skip copies of the repo in Claude Code worktrees (.claude/worktrees/).
  test: { exclude: ['**/node_modules/**', '.claude/**'] },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Pregunta del día — Spanish Question of the Day',
        short_name: 'Pregunta',
        description: 'Draw one Spanish conversation card every day.',
        // Stable identity for the installed app, so moving start_url later doesn't make it a new app.
        id: '/',
        lang: 'es',
        dir: 'ltr',
        categories: ['education'],
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#012a45',
        theme_color: '#012a45',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Shown in the richer install dialog (Chrome on Android and desktop).
        screenshots: [
          { src: 'screenshots/narrow-deck.webp', sizes: '1170x2532', type: 'image/webp', form_factor: 'narrow', label: 'Elige una baraja y saca una carta' },
          { src: 'screenshots/narrow-card.webp', sizes: '1170x2532', type: 'image/webp', form_factor: 'narrow', label: 'Cada carta, con traducción y vocabulario' },
          { src: 'screenshots/wide-card.webp', sizes: '1920x1200', type: 'image/webp', form_factor: 'wide', label: 'Preguntas para conversar en español' },
        ],
      },
      workbox: {
        // The whole deck is bundled into the JS and the font is self-hosted,
        // so everything is precached and the app works fully offline from the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Install-dialog screenshots aren't needed offline.
        globIgnores: ['screenshots/**'],
      },
    }),
  ],
});
