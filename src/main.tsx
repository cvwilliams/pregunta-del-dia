// Standalone PWA entry. In Astro you import `PreguntaDelDia` directly instead.
import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import PreguntaDelDia from './PreguntaDelDia';
import ThemeToggle from './ThemeToggle';
import './app.css';

registerSW({ immediate: true });
render(
  <>
    <ThemeToggle />
    {/* The deck is the whole page here, so its title is the page's h1. */}
    <PreguntaDelDia headingLevel={1} />
  </>,
  document.getElementById('app')!,
);
