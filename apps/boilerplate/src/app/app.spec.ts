import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { App } from './app';
import { BOILERPLATE_I18N_CONFIG } from './i18n.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: I18N_CONFIG_TOKEN, useValue: BOILERPLATE_I18N_CONFIG }
      ]
    }).compileComponents();
  });

  it('renders the application shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.boilerplate-brand')?.textContent).toContain('ibid boilerplate');
    expect(compiled.querySelector('ibid-header')).not.toBeNull();
    expect(compiled.querySelector('ibid-header-nav')).not.toBeNull();
  });

  it('starts with the navigation closed and opens it on toggle', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.o-header-nav--open')).toBeNull();

    compiled.querySelector<HTMLButtonElement>('.a-icon-button')?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.o-header-nav--open')).not.toBeNull();
  });

  it('closes the navigation when the scrim is dismissed', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.a-icon-button')?.click();
    await fixture.whenStable();

    compiled.querySelector<HTMLButtonElement>('.a-scrim')?.click();
    await fixture.whenStable();

    expect(compiled.querySelector('.o-header-nav--open')).toBeNull();
  });
});
