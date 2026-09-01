import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartLegendComponent } from './chart-legend';

describe('ChartLegendComponent', () => {
  let fixture: ComponentFixture<ChartLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChartLegendComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChartLegendComponent);
  });

  it('renders one legend item per entry', () => {
    fixture.componentRef.setInput('entries', [
      { label: 'receita', color: 'var(--color-teal-mid)' },
      { label: 'despesa', color: 'var(--color-coral-mid)' }
    ]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ibid-legend-item');
    expect(items.length).toBe(2);
  });

  it('renders nothing for an empty list', () => {
    fixture.componentRef.setInput('entries', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('ibid-legend-item').length).toBe(0);
  });
});
