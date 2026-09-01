import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartBarSegmentComponent } from './chart-bar-segment';

describe('ChartBarSegmentComponent', () => {
  let fixture: ComponentFixture<ChartBarSegmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChartBarSegmentComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChartBarSegmentComponent);
    fixture.componentRef.setInput('percentage', 62);
  });

  function bar(): HTMLElement {
    return fixture.nativeElement.querySelector('.a-chart-bar-segment');
  }

  it('reflects the percentage as a CSS custom property', () => {
    fixture.detectChanges();
    expect(bar().style.getPropertyValue('--chart-bar-segment-size')).toBe('62%');
  });

  it('defaults to the vertical orientation without a modifier class', () => {
    fixture.detectChanges();
    expect(bar().classList.contains('a-chart-bar-segment--horizontal')).toBe(false);
  });

  it('applies the horizontal modifier class when orientation is horizontal', () => {
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    expect(bar().classList.contains('a-chart-bar-segment--horizontal')).toBe(true);
  });

  it('applies the max modifier class when role is max', () => {
    fixture.componentRef.setInput('role', 'max');
    fixture.detectChanges();
    expect(bar().classList.contains('a-chart-bar-segment--max')).toBe(true);
  });

  it('applies the min modifier class when role is min', () => {
    fixture.componentRef.setInput('role', 'min');
    fixture.detectChanges();
    expect(bar().classList.contains('a-chart-bar-segment--min')).toBe(true);
  });
});
