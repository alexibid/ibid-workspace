import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN, THEME_CONFIG_TOKEN, ThemeService } from '@ibid/services';
import { App } from './app';
import { BOILERPLATE_I18N_CONFIG } from './i18n.config';
import { BOILERPLATE_THEME_CONFIG } from './theme.config';

const NAV_TOGGLE = '.boilerplate-nav-toggle button';
const LANGUAGE_TOGGLE = '.boilerplate-language-toggle button';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.body.className = '';
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: I18N_CONFIG_TOKEN, useValue: BOILERPLATE_I18N_CONFIG },
        { provide: THEME_CONFIG_TOKEN, useValue: BOILERPLATE_THEME_CONFIG }
      ]
    }).compileComponents();
  });

  it('renders the application shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.boilerplate-brand')?.textContent).toContain('boilerplate');
    expect(compiled.querySelector('ibid-header')).not.toBeNull();
    expect(compiled.querySelector('ibid-header-nav')).not.toBeNull();
  });

  it('starts with the navigation closed and opens it on toggle', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.o-header-nav--open')).toBeNull();

    compiled.querySelector<HTMLButtonElement>(NAV_TOGGLE)?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.o-header-nav--open')).not.toBeNull();
  });

  it('closes the navigation when the scrim is dismissed', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>(NAV_TOGGLE)?.click();
    await fixture.whenStable();

    compiled.querySelector<HTMLButtonElement>('.a-scrim')?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.o-header-nav--open')).toBeNull();
  });

  it('switches the language from the header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const code = () => compiled.querySelector('.boilerplate-language-toggle__code')?.textContent;
    expect(code()).toContain('PT');

    compiled.querySelector<HTMLButtonElement>(LANGUAGE_TOGGLE)?.click();
    await fixture.whenStable();

    expect(code()).toContain('EN');
  });

  it('wears the default theme as a body class and swaps it on selection', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(document.body.classList.contains('glass-surface')).toBe(true);

    TestBed.inject(ThemeService).select('kirigami');
    await fixture.whenStable();

    expect(document.body.classList.contains('glass-surface')).toBe(false);
    expect(document.body.classList.contains('kirigami')).toBe(true);
  });
});
