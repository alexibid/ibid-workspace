import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartHeadlineComponent } from './chart-headline';
import { I18nService } from '@ibid/services';
import { createMockI18nService } from '../../../testing/i18n.mock';

describe('ChartHeadlineComponent', () => {
  let fixture: ComponentFixture<ChartHeadlineComponent>;

  const mockI18nService = createMockI18nService();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartHeadlineComponent],
      providers: [{ provide: I18nService, useValue: mockI18nService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ChartHeadlineComponent);
  });

  it('renders the caption and context text', () => {
    fixture.componentRef.setInput('caption', 'saldo atual');
    fixture.componentRef.setInput('value', 12480);
    fixture.componentRef.setInput('context', 'a subir desde o mín de 8 200€ este mês');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('saldo atual');
    expect(fixture.nativeElement.textContent).toContain('a subir desde o mín de 8 200€ este mês');
  });

  it('delegates the value to the currency display atom for formatting', () => {
    fixture.componentRef.setInput('caption', 'saldo atual');
    fixture.componentRef.setInput('value', 12480);
    fixture.componentRef.setInput('context', '');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('12480.00 €');
  });
});
