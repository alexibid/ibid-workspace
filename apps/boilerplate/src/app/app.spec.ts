import { TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { App } from './app';
import { BOILERPLATE_I18N_CONFIG } from './i18n.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: I18N_CONFIG_TOKEN, useValue: BOILERPLATE_I18N_CONFIG }]
    }).compileComponents();
  });

  it('renders the boilerplate title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('ibid boilerplate');
  });
});
