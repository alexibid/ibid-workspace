import { TestBed } from '@angular/core/testing';
import { THEME_CONFIG_TOKEN, ThemeService } from './theme.service';
import {
  MOCK_THEME_CONFIG,
  MOCK_THEME_STORAGE_KEY,
  MOCK_UNDECLARED_THEME_ID
} from './theme.mock';

describe('ThemeService', () => {
  const bodyClasses = (): readonly string[] => [...document.body.classList];

  const serviceWithStoredTheme = (stored?: string): ThemeService => {
    if (stored) localStorage.setItem(MOCK_THEME_STORAGE_KEY, stored);
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_CONFIG_TOKEN, useValue: MOCK_THEME_CONFIG }]
    });
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.body.className = '';
  });

  it('wears the configured default theme on creation', () => {
    const service = serviceWithStoredTheme();

    expect(service.theme()).toBe('glass-surface');
    expect(bodyClasses()).toContain('glass-surface');
  });

  it('exposes the declared themes', () => {
    const service = serviceWithStoredTheme();

    expect(service.themes.map(theme => theme.id)).toEqual(['base', 'glass-surface', 'kirigami']);
  });

  it('restores a stored theme over the default', () => {
    const service = serviceWithStoredTheme('kirigami');

    expect(service.theme()).toBe('kirigami');
    expect(bodyClasses()).toContain('kirigami');
  });

  it('falls back to the default when the stored theme is not declared', () => {
    const service = serviceWithStoredTheme(MOCK_UNDECLARED_THEME_ID);

    expect(service.theme()).toBe('glass-surface');
    expect(bodyClasses()).not.toContain(MOCK_UNDECLARED_THEME_ID);
  });

  it('removes the previous theme class when another is selected', () => {
    const service = serviceWithStoredTheme();

    service.select('kirigami');

    expect(bodyClasses()).toContain('kirigami');
    expect(bodyClasses()).not.toContain('glass-surface');
  });

  it('leaves classes it does not own untouched', () => {
    document.body.classList.add('boilerplate');
    const service = serviceWithStoredTheme();

    service.select('base');

    expect(bodyClasses()).toContain('boilerplate');
    expect(bodyClasses()).toContain('base');
  });

  it('persists the selection', () => {
    const service = serviceWithStoredTheme();

    service.select('kirigami');

    expect(localStorage.getItem(MOCK_THEME_STORAGE_KEY)).toBe('kirigami');
  });

  it('rejects a theme the app never declared', () => {
    const service = serviceWithStoredTheme();

    expect(() => service.select(MOCK_UNDECLARED_THEME_ID)).toThrowError(
      `Unknown theme "${MOCK_UNDECLARED_THEME_ID}". Declare it in the ThemeConfig of this app.`
    );
    expect(service.theme()).toBe('glass-surface');
  });

  it('wears nothing and declares nothing when no config is provided', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(service.themes).toEqual([]);
    expect(bodyClasses()).toEqual([]);
  });
});
