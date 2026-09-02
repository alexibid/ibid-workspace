import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card';
import { I18nService } from '@ibid/services';
import { createMockI18nService } from '../../../testing/i18n.mock';
import { MOCK_STAT_CURRENCY, MOCK_STAT_FEATURED, MOCK_STAT_PLAIN } from './stat-card.mock';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [{ provide: I18nService, useValue: createMockI18nService() }]
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
  });

  it('renders label and currency value', () => {
    fixture.componentRef.setInput('data', MOCK_STAT_CURRENCY);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.m-stat-card__label');
    const value = fixture.nativeElement.querySelector('.m-stat-card__value');

    expect(label?.textContent?.trim()).toBe('Income');
    expect(value?.textContent?.trim()).toBe('3200.00 €');
    expect(value?.classList.contains('m-stat-card__value--success')).toBe(true);
  });

  it('renders non-currency value directly', () => {
    fixture.componentRef.setInput('data', MOCK_STAT_PLAIN);
    fixture.detectChanges();

    const value = fixture.nativeElement.querySelector('.m-stat-card__value');
    expect(value?.textContent?.trim()).toBe('42 items');
    expect(value?.classList.contains('m-stat-card__value--neutral')).toBe(true);
  });

  it('renders feature-display component when useFeatureDisplay is true', () => {
    fixture.componentRef.setInput('data', MOCK_STAT_FEATURED);
    fixture.detectChanges();

    const featureDisplay = fixture.nativeElement.querySelector('ibid-feature-display');
    expect(featureDisplay).not.toBeNull();
  });
});
