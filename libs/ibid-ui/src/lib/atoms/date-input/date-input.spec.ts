import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateInputComponent } from './date-input';

describe('DateInputComponent', () => {
  let component: DateInputComponent;
  let fixture: ComponentFixture<DateInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formats single date display correctly', () => {
    fixture.componentRef.setInput('value', '2026-08-07');
    fixture.detectChanges();
    expect(component['formattedDisplay']()).toBe('07/08/2026');
  });

  it('formats date range display correctly', () => {
    fixture.componentRef.setInput('isRange', true);
    fixture.componentRef.setInput('startDate', '2026-08-01');
    fixture.componentRef.setInput('endDate', '2026-08-07');
    fixture.detectChanges();
    expect(component['formattedDisplay']()).toBe('01/08/2026 – 07/08/2026');
  });

  it('updates local state immediately on day selection in single mode', () => {
    const emitted: string[] = [];
    component.valueChange.subscribe(val => emitted.push(val));

    component.selectDay({ date: '2026-08-15', day: 15, isCurrentMonth: true });
    fixture.detectChanges();

    expect(component['formattedDisplay']()).toBe('15/08/2026');
    expect(emitted).toEqual(['2026-08-15']);
  });

  it('updates local state immediately on day range selection in range mode', () => {
    fixture.componentRef.setInput('isRange', true);
    fixture.detectChanges();

    const rangeEmitted: { start: string; end: string }[] = [];
    component.rangeChange.subscribe(range => rangeEmitted.push(range));

    component.selectDay({ date: '2026-08-05', day: 5, isCurrentMonth: true });
    expect(rangeEmitted.length).toBe(0);

    component.selectDay({ date: '2026-08-20', day: 20, isCurrentMonth: true });
    fixture.detectChanges();

    expect(component['formattedDisplay']()).toBe('05/08/2026 – 20/08/2026');
    expect(rangeEmitted).toEqual([{ start: '2026-08-05', end: '2026-08-20' }]);
  });
});
