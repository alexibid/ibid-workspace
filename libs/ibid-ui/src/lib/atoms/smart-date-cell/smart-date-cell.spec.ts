import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartDateCellComponent } from './smart-date-cell';
import { I18nService } from '@ibid/services';

describe('SmartDateCellComponent', () => {
  let fixture: ComponentFixture<SmartDateCellComponent>;

  const mockI18nService = {
    currentLang: () => 'pt' as const,
    formatDate: (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartDateCellComponent],
      providers: [
        { provide: I18nService, useValue: mockI18nService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartDateCellComponent);
    fixture.componentRef.setInput('periodStart', '2026-07-28');
    fixture.componentRef.setInput('periodEnd', '2026-08-28');
  });

  it('renders day+month with no year when there is no previous value', () => {
    fixture.componentRef.setInput('value', '2026-08-02');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-smart-date-cell').textContent.trim()).toBe('2 ago');
  });

  it('renders the year when it differs from the previous row', () => {
    fixture.componentRef.setInput('value', '2026-01-01');
    fixture.componentRef.setInput('previousValue', '2025-12-31');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-smart-date-cell').textContent.trim()).toBe('1 jan 2026');
  });

  it('opens the popover on click and closes on a second click', () => {
    fixture.componentRef.setInput('value', '2026-08-02');
    fixture.detectChanges();
    expect(fixture.componentInstance['isOpen']()).toBe(false);

    fixture.nativeElement.querySelector('.a-smart-date-cell').click();
    expect(fixture.componentInstance['isOpen']()).toBe(true);

    fixture.nativeElement.querySelector('.a-smart-date-cell').click();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('computes the full date and the analyzed period from the active store range', () => {
    fixture.componentRef.setInput('value', '2026-08-02');
    fixture.detectChanges();

    expect(fixture.componentInstance['fullDate']()).toBe('02/08/2026');
    expect(fixture.componentInstance['periodLabel']()).toBe('28/07/2026 – 28/08/2026');
  });
});
