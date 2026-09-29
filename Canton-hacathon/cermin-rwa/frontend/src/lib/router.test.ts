import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { appHash, legacyRedirectTarget, parseRoute, stripHash, useRoute } from './router';

// Task 19 — `/` (empty hash) is the public Landing page; every app screen
// moved under `#/app/...`; legacy bare hashes (`#/dashboard` etc.) must keep
// working AND get silently rewritten to their new home. This project's
// vitest environment is `node` (no jsdom, no @testing-library/react — see
// PriceChart.test.ts's doc comment), so the pure hash <-> Route mapping is
// unit-tested directly, and the hook's initial-mount redirect behavior is
// proven the same way PriceChart.test.ts proves its own markup: render it
// server-side with `react-dom/server` and assert on the effect (here, the
// stubbed `history.replaceState` call) instead of driving a real DOM.

describe('stripHash', () => {
  it('strips the leading # and an optional following slash', () => {
    expect(stripHash('')).toBe('');
    expect(stripHash('#')).toBe('');
    expect(stripHash('#/')).toBe('');
    expect(stripHash('#app')).toBe('app');
    expect(stripHash('#/app')).toBe('app');
    expect(stripHash('#/app/borrow')).toBe('app/borrow');
  });

  it('strips a trailing slash', () => {
    expect(stripHash('#/app/borrow/')).toBe('app/borrow');
  });
});

describe('appHash', () => {
  it('dashboard is the bare #/app; every other screen is #/app/<screen>', () => {
    expect(appHash('dashboard')).toBe('#/app');
    expect(appHash('borrow')).toBe('#/app/borrow');
    expect(appHash('vault')).toBe('#/app/vault');
    expect(appHash('simulate')).toBe('#/app/simulate');
    expect(appHash('onboarding')).toBe('#/app/onboarding');
  });
});

describe('legacyRedirectTarget', () => {
  it('maps every legacy bare screen name to its #/app/... home', () => {
    expect(legacyRedirectTarget('dashboard')).toBe('#/app');
    expect(legacyRedirectTarget('borrow')).toBe('#/app/borrow');
    expect(legacyRedirectTarget('vault')).toBe('#/app/vault');
    expect(legacyRedirectTarget('simulate')).toBe('#/app/simulate');
    expect(legacyRedirectTarget('onboarding')).toBe('#/app/onboarding');
  });

  it('is null for anything that is not a legacy bare screen', () => {
    expect(legacyRedirectTarget('')).toBeNull();
    expect(legacyRedirectTarget('app')).toBeNull();
    expect(legacyRedirectTarget('app/borrow')).toBeNull();
    expect(legacyRedirectTarget('how-it-works')).toBeNull();
  });
});

describe('parseRoute — the hash-path -> Route mapping', () => {
  it('empty path is the public Landing page', () => {
    expect(parseRoute('')).toEqual({ view: 'landing', screen: 'dashboard' });
  });

  it('"app" alone is the dashboard', () => {
    expect(parseRoute('app')).toEqual({ view: 'app', screen: 'dashboard' });
  });

  it('"app/<screen>" resolves every app screen', () => {
    expect(parseRoute('app/borrow')).toEqual({ view: 'app', screen: 'borrow' });
    expect(parseRoute('app/vault')).toEqual({ view: 'app', screen: 'vault' });
    expect(parseRoute('app/simulate')).toEqual({ view: 'app', screen: 'simulate' });
    expect(parseRoute('app/onboarding')).toEqual({ view: 'app', screen: 'onboarding' });
    expect(parseRoute('app/dashboard')).toEqual({ view: 'app', screen: 'dashboard' });
  });

  it('an unrecognized "app/..." subpath falls back to the dashboard, not garbage', () => {
    expect(parseRoute('app/nonsense')).toEqual({ view: 'app', screen: 'dashboard' });
  });

  it('legacy bare screen paths still resolve to the right screen (before the URL rewrite)', () => {
    expect(parseRoute('dashboard')).toEqual({ view: 'app', screen: 'dashboard' });
    expect(parseRoute('borrow')).toEqual({ view: 'app', screen: 'borrow' });
    expect(parseRoute('vault')).toEqual({ view: 'app', screen: 'vault' });
    expect(parseRoute('simulate')).toEqual({ view: 'app', screen: 'simulate' });
    expect(parseRoute('onboarding')).toEqual({ view: 'app', screen: 'onboarding' });
  });

  it('a totally unrecognized path falls back to Landing, not a crash', () => {
    expect(parseRoute('foobar')).toEqual({ view: 'landing', screen: 'dashboard' });
  });
});

describe('useRoute — legacy hashes are rewritten on first read', () => {
  function RouteProbe() {
    const [route] = useRoute();
    return createElement('div', { 'data-view': route.view, 'data-screen': route.screen });
  }

  function stubWindow(hash: string) {
    const win = { location: { hash }, history: { replaceState: vi.fn() } };
    vi.stubGlobal('window', win);
    return win;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rewrites a legacy #/dashboard to the canonical #/app and resolves the dashboard', () => {
    const win = stubWindow('#/dashboard');
    const html = renderToStaticMarkup(createElement(RouteProbe));
    expect(html).toContain('data-view="app"');
    expect(html).toContain('data-screen="dashboard"');
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '#/app');
  });

  it('rewrites a legacy #/borrow to #/app/borrow', () => {
    const win = stubWindow('#/borrow');
    const html = renderToStaticMarkup(createElement(RouteProbe));
    expect(html).toContain('data-screen="borrow"');
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '#/app/borrow');
  });

  it('rewrites legacy #/vault and #/simulate too', () => {
    let win = stubWindow('#/vault');
    renderToStaticMarkup(createElement(RouteProbe));
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '#/app/vault');

    vi.unstubAllGlobals();
    win = stubWindow('#/simulate');
    renderToStaticMarkup(createElement(RouteProbe));
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '#/app/simulate');
  });

  it('an empty hash resolves to Landing and never touches history', () => {
    const win = stubWindow('');
    const html = renderToStaticMarkup(createElement(RouteProbe));
    expect(html).toContain('data-view="landing"');
    expect(win.history.replaceState).not.toHaveBeenCalled();
  });

  it('a canonical #/app/vault deep link is left alone', () => {
    const win = stubWindow('#/app/vault');
    const html = renderToStaticMarkup(createElement(RouteProbe));
    expect(html).toContain('data-view="app"');
    expect(html).toContain('data-screen="vault"');
    expect(win.history.replaceState).not.toHaveBeenCalled();
  });
});
