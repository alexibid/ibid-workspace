import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartCurrencyCellComponent } from './smart-currency-cell';
import { I18nService } from '@ibid/services';
import { createMockI18nService } from '../../../testing/i18n.mock';

describe('SmartCurrencyCellComponent', () => {
  let fixture: ComponentFixture<SmartCurrencyCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartCurrencyCellComponent],
      providers: [{ provide: I18nService, useValue: createMockI18nService() }]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartCurrencyCellComponent);
  });

  it('applies the negative modifier class for a negative primary value', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-currency-cell');
    expect(el.classList.contains('a-smart-currency-cell--negative')).toBe(true);
  });

  it('applies the positive modifier class for a positive primary value', () => {
    fixture.componentRef.setInput('value', 2150);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-currency-cell');
    expect(el.classList.contains('a-smart-currency-cell--positive')).toBe(true);
  });

  it('applies sign coloring for the secondary variant too', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-currency-cell');
    expect(el.classList.contains('a-smart-currency-cell--negative')).toBe(true);
    expect(el.classList.contains('a-smart-currency-cell--secondary')).toBe(true);
  });

  it('shows an em dash for an undefined value instead of formatting it', () => {
    fixture.componentRef.setInput('value', undefined);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('—');
  });

  it('opens the popover on click and closes on a second click', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.detectChanges();
    expect(fixture.componentInstance['isOpen']()).toBe(false);

    fixture.nativeElement.querySelector('.a-smart-currency-cell').click();
    expect(fixture.componentInstance['isOpen']()).toBe(true);

    fixture.nativeElement.querySelector('.a-smart-currency-cell').click();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('formats the balance for the popover, falling back to an em dash when absent', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.detectChanges();
    expect(fixture.componentInstance['balanceDisplay']()).toBe('—');

    fixture.componentRef.setInput('balance', 12480);
    fixture.detectChanges();
    expect(fixture.componentInstance['balanceDisplay']()).toBe('12480.00 €');
  });

  it('renders as a plain, non-clickable span when interactive is false', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.componentRef.setInput('interactive', false);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-currency-cell');
    expect(el.tagName).toBe('SPAN');
    expect(el.classList.contains('a-smart-currency-cell--negative')).toBe(true);
  });
});
