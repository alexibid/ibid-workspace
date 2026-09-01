import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartMarkerDotComponent } from './chart-marker-dot';

describe('ChartMarkerDotComponent', () => {
  let fixture: ComponentFixture<ChartMarkerDotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChartMarkerDotComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChartMarkerDotComponent);
  });

  function dot(): HTMLElement {
    return fixture.nativeElement.querySelector('.a-chart-marker-dot');
  }

  it('applies no role modifier for the default role', () => {
    fixture.detectChanges();
    expect(dot().className.trim()).toBe('a-chart-marker-dot');
  });

  it('applies the first modifier class when role is first', () => {
    fixture.componentRef.setInput('role', 'first');
    fixture.detectChanges();
    expect(dot().classList.contains('a-chart-marker-dot--first')).toBe(true);
  });

  it('applies the last modifier class when role is last', () => {
    fixture.componentRef.setInput('role', 'last');
    fixture.detectChanges();
    expect(dot().classList.contains('a-chart-marker-dot--last')).toBe(true);
  });

  it('applies the max modifier class when role is max', () => {
    fixture.componentRef.setInput('role', 'max');
    fixture.detectChanges();
    expect(dot().classList.contains('a-chart-marker-dot--max')).toBe(true);
  });

  it('applies the min modifier class when role is min', () => {
    fixture.componentRef.setInput('role', 'min');
    fixture.detectChanges();
    expect(dot().classList.contains('a-chart-marker-dot--min')).toBe(true);
  });

  it('applies the active modifier class when active is true', () => {
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    expect(dot().classList.contains('a-chart-marker-dot--active')).toBe(true);
  });
});
