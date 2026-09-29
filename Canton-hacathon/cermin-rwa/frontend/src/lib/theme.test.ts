import { describe, expect, it, vi } from 'vitest';
import { applyTheme, getStoredTheme, getSystemTheme, readAppliedTheme, resolveInitialTheme, THEME_STORAGE_KEY } from './theme';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    removeItem: (key: string) => {
      delete data[key];
    },
    clear: () => {
      for (const key of Object.keys(data)) delete data[key];
    },
    key: () => null,
    length: 0,
  } as Storage;
}

function fakeDocument(theme?: string): Document {
  const attrs: Record<string, string> = theme ? { 'data-theme': theme } : {};
  return {
    documentElement: {
      setAttribute: (name: string, value: string) => {
        attrs[name] = value;
      },
      getAttribute: (name: string) => attrs[name] ?? null,
    },
  } as unknown as Document;
}

describe('getStoredTheme', () => {
  it('reads a valid stored value', () => {
    expect(getStoredTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
    expect(getStoredTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
  });

  it('treats missing or garbage values as "no preference saved"', () => {
    expect(getStoredTheme(fakeStorage())).toBeNull();
    expect(getStoredTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'sepia' }))).toBeNull();
  });
});

describe('getSystemTheme', () => {
  it('follows the OS preference when it explicitly asks for light', () => {
    expect(getSystemTheme(true)).toBe('light');
  });

  it('defaults to dark otherwise (matches the palette the demo is built around)', () => {
    expect(getSystemTheme(false)).toBe('dark');
  });
});

describe('resolveInitialTheme', () => {
  it('prefers a stored choice over the system preference', () => {
    expect(resolveInitialTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'light' }), false)).toBe('light');
    expect(resolveInitialTheme(fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }), true)).toBe('dark');
  });

  it('falls back to the system preference with nothing stored', () => {
    expect(resolveInitialTheme(fakeStorage(), true)).toBe('light');
    expect(resolveInitialTheme(fakeStorage(), false)).toBe('dark');
  });
});

describe('applyTheme / readAppliedTheme', () => {
  it('sets the data-theme attribute and persists the choice', () => {
    const storage = fakeStorage();
    const setItem = vi.spyOn(storage, 'setItem');
    const doc = fakeDocument();

    applyTheme('light', doc, storage);

    expect(readAppliedTheme(doc)).toBe('light');
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
  });

  it('readAppliedTheme defaults to dark when nothing is set', () => {
    expect(readAppliedTheme(fakeDocument())).toBe('dark');
  });
});
