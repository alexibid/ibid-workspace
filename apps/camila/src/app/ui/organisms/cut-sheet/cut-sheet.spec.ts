import { TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { CAMILA_I18N_CONFIG } from '../../../i18n.config';
import { CutSheetComponent, SheetVariant } from './cut-sheet';

const SHEET_NAME = CAMILA_I18N_CONFIG.translations['pt']['sheetName'];

describe('CutSheetComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CutSheetComponent],
      providers: [{ provide: I18N_CONFIG_TOKEN, useValue: CAMILA_I18N_CONFIG }],
    })
  );

  function render(variant: SheetVariant = 'coloured') {
    const fixture = TestBed.createComponent(CutSheetComponent);
    fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('lays the sheet out on an A4 page', () => {
    expect(render().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 210 297');
  });

  it('offers three interchangeable eye strips', () => {
    expect(render().querySelectorAll('.o-cut-sheet__eye-strips .o-cut-sheet__part')).toHaveLength(3);
  });

  it('carries four crest strips', () => {
    expect(render().querySelectorAll('.o-cut-sheet__crests .o-cut-sheet__accent')).toHaveLength(4);
  });

  it('marks cut lines, fold lines, flaps and glue areas as four different marks', () => {
    const element = render();

    expect(element.querySelectorAll('.o-cut-sheet__cut').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('.o-cut-sheet__fold').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('.o-cut-sheet__flap').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('.o-cut-sheet__glue').length).toBeGreaterThan(0);
  });

  it('drops every fill for the sheet meant to be coloured in', () => {
    expect(render('outline').querySelector('.o-cut-sheet--outline')).not.toBeNull();
    expect(render('coloured').querySelector('.o-cut-sheet--outline')).toBeNull();
  });

  it('names the sheet for assistive technology', () => {
    const svg = render().querySelector('svg') as SVGElement;

    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe(SHEET_NAME);
  });
});
