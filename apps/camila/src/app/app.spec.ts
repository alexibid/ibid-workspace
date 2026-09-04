import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { App } from './app';
import { CAMILA_I18N_CONFIG } from './i18n.config';
import { provideCamilaTheme } from './theme.config';

@Component({ selector: 'camila-stub-page', standalone: true, template: '' })
class StubPage {}

const ROUTES = [
  { path: '', component: StubPage },
  { path: 'diario', component: StubPage },
];

const PROFILE = '.camila-profile';
const LANGUAGE = '.camila-language';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.body.className = '';
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(ROUTES),
        { provide: I18N_CONFIG_TOKEN, useValue: CAMILA_I18N_CONFIG },
        ...provideCamilaTheme(),
      ],
    }).compileComponents();
  });

  async function render() {
    await TestBed.inject(Router).navigateByUrl('/');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture;
  }

  it('renders the shell with the brand and a header', async () => {
    const compiled = (await render()).nativeElement as HTMLElement;

    expect(compiled.querySelector('.camila-brand')?.textContent).toContain('Camila');
    expect(compiled.querySelector('ibid-header')).not.toBeNull();
  });

  it('calls the grown-ups while the child screen is showing', async () => {
    const compiled = (await render()).nativeElement as HTMLElement;

    expect(compiled.querySelector(PROFILE)?.textContent?.trim()).toBe(
      CAMILA_I18N_CONFIG.translations['pt']['toParents']
    );
  });

  it('moves to the diary when the profile is switched', async () => {
    const fixture = await render();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>(PROFILE)?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toContain('/diario');
  });

  it('switches the language from the header', async () => {
    const fixture = await render();
    const compiled = fixture.nativeElement as HTMLElement;
    const code = () => compiled.querySelector(LANGUAGE)?.textContent?.trim();

    expect(code()).toBe('PT');

    compiled.querySelector<HTMLButtonElement>(LANGUAGE)?.click();
    await fixture.whenStable();

    expect(code()).toBe('EN');
  });

  it('wears the kirigami theme as a body class', async () => {
    await render();

    expect(document.body.classList.contains('kirigami')).toBe(true);
  });
});
