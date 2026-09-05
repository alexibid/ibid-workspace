import { Component, EventEmitter, Output, computed, input, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';
import { CalendarDay, buildMonthGrid, formatDateLocal, parseLocalDate } from '@ibid/utils';

export type DatePickerView = 'date' | 'month' | 'year';

const EARLIEST_SELECTABLE_YEAR = 1900;
const LATEST_SELECTABLE_YEAR = 2100;

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-date-picker-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, HandDrawnDirective],
  template: `
    <div class="a-date-input__popover" [ibidHandDrawn]="3">
      <header class="a-date-input__nav">
        <button type="button" class="a-date-input__nav-btn" (click)="previous()" [disabled]="!canGoPrevious()">
          <ibid-icon name="chevron-left"></ibid-icon>
        </button>
        <div class="a-date-input__nav-center">
          <button type="button" class="a-date-input__nav-center-btn" (click)="setPickerView('month')">{{ currentMonthName() }}</button>
          <button type="button" class="a-date-input__nav-center-btn" (click)="setPickerView('year')">{{ currentYearName() }}</button>
        </div>
        <button type="button" class="a-date-input__nav-btn" (click)="next()" [disabled]="!canGoNext()">
          <ibid-icon name="chevron-right"></ibid-icon>
        </button>
      </header>

      @if (pickerView() === 'date') {
        <div class="a-date-input__weekdays">
          @for (label of weekdayLabels; track $index) {
            <span>{{ label }}</span>
          }
        </div>

        <div class="a-date-input__grid">
          @for (day of days(); track day.date) {
            <button
              type="button"
              class="a-date-input__day"
              [class.a-date-input__day--muted]="!day.isCurrentMonth"
              [class.a-date-input__day--selected]="isSelected(day.date)"
              [class.a-date-input__day--range-start]="isRangeStart(day.date)"
              [class.a-date-input__day--range-end]="isRangeEnd(day.date)"
              [class.a-date-input__day--in-range]="isInRange(day.date)"
              [class.a-date-input__day--today]="day.date === today"
              [disabled]="isDayDisabled(day.date)"
              (click)="selectDay(day)"
            >
              {{ day.day }}
            </button>
          }
        </div>
      }

      @if (pickerView() === 'month') {
        <div class="a-date-input__grid-months">
          @for (month of availableMonths(); track month.index) {
            <button
              type="button"
              class="a-date-input__month-btn"
              [class.a-date-input__month-btn--selected]="month.index === viewDate().getMonth()"
              [disabled]="month.disabled"
              (click)="selectMonth(month.index)"
            >
              {{ month.name }}
            </button>
          }
        </div>
      }

      @if (pickerView() === 'year') {
        <div class="a-date-input__grid-years">
          @for (year of availableYears(); track year) {
            <button
              type="button"
              class="a-date-input__year-btn"
              [class.a-date-input__year-btn--selected]="year === viewDate().getFullYear()"
              (click)="selectYear(year)"
            >
              {{ year }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './date-picker-panel.scss'
})
export class DatePickerPanelComponent {
  readonly initialDate = input<string>('');
  readonly selected = input<string>('');
  readonly rangeStart = input<string>('');
  readonly rangeEnd = input<string>('');
  readonly pendingStart = input<string | null>(null);
  readonly isRange = input<boolean>(false);
  readonly minDate = input<string>('');
  readonly maxDate = input<string>('');

  @Output() daySelected = new EventEmitter<CalendarDay>();

  protected readonly weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  protected readonly today = formatDateLocal(new Date());
  protected readonly pickerView = signal<DatePickerView>('date');
  protected readonly viewDate = signal(new Date());

  constructor() {
    const initial = this.initialDate();
    if (initial && initial.trim().length > 0) {
      const parsed = parseLocalDate(initial);
      if (!isNaN(parsed.getTime())) this.viewDate.set(parsed);
    }
  }

  protected readonly currentMonthName = computed(() =>
    new Intl.DateTimeFormat('pt-PT', { month: 'long' }).format(this.viewDate()).replace('.', '')
  );

  protected readonly currentYearName = computed(() =>
    new Intl.DateTimeFormat('pt-PT', { year: 'numeric' }).format(this.viewDate())
  );

  protected readonly days = computed(() =>
    buildMonthGrid(this.viewDate().getFullYear(), this.viewDate().getMonth())
  );

  private readonly minDateObj = computed(() => this.minDate() ? parseLocalDate(this.minDate()) : null);
  private readonly maxDateObj = computed(() => this.maxDate() ? parseLocalDate(this.maxDate()) : null);

  protected readonly availableYears = computed(() => {
    const min = this.minDateObj();
    const max = this.maxDateObj();

    const startYear = min ? min.getFullYear() : EARLIEST_SELECTABLE_YEAR;
    const endYear = max ? max.getFullYear() : LATEST_SELECTABLE_YEAR;

    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  });

  protected readonly availableMonths = computed(() => {
    const formatter = new Intl.DateTimeFormat('pt-PT', { month: 'long' });
    const currentYear = this.viewDate().getFullYear();
    const min = this.minDateObj();
    const max = this.maxDateObj();

    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      const name = formatter.format(date).replace('.', '');
      let isDisabled = false;

      if (min && (currentYear < min.getFullYear() || (currentYear === min.getFullYear() && i < min.getMonth()))) {
        isDisabled = true;
      }
      if (max && (currentYear > max.getFullYear() || (currentYear === max.getFullYear() && i > max.getMonth()))) {
        isDisabled = true;
      }

      return { index: i, name, disabled: isDisabled };
    });
  });

  setPickerView(view: DatePickerView): void {
    if (this.pickerView() === view) {
      this.pickerView.set('date');
    } else {
      this.pickerView.set(view);
    }
  }

  canGoPrevious(): boolean {
    if (this.pickerView() === 'year') return false;

    const min = this.minDateObj();
    if (!min) return true;

    const v = this.viewDate();
    if (this.pickerView() === 'date') {
      return v.getFullYear() > min.getFullYear() || (v.getFullYear() === min.getFullYear() && v.getMonth() > min.getMonth());
    }

    if (this.pickerView() === 'month') {
      return v.getFullYear() > min.getFullYear();
    }

    return true;
  }

  canGoNext(): boolean {
    if (this.pickerView() === 'year') return false;

    const max = this.maxDateObj();
    if (!max) return true;

    const v = this.viewDate();
    if (this.pickerView() === 'date') {
      return v.getFullYear() < max.getFullYear() || (v.getFullYear() === max.getFullYear() && v.getMonth() < max.getMonth());
    }

    if (this.pickerView() === 'month') {
      return v.getFullYear() < max.getFullYear();
    }

    return true;
  }

  previous(): void {
    if (!this.canGoPrevious()) return;
    const d = this.viewDate();
    if (this.pickerView() === 'date') {
      this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (this.pickerView() === 'month') {
      this.viewDate.set(new Date(d.getFullYear() - 1, d.getMonth(), 1));
    }
  }

  next(): void {
    if (!this.canGoNext()) return;
    const d = this.viewDate();
    if (this.pickerView() === 'date') {
      this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (this.pickerView() === 'month') {
      this.viewDate.set(new Date(d.getFullYear() + 1, d.getMonth(), 1));
    }
  }

  selectMonth(monthIndex: number): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), monthIndex, 1));
    this.pickerView.set('date');
  }

  selectYear(year: number): void {
    const d = this.viewDate();
    let newMonth = d.getMonth();

    const min = this.minDateObj();
    const max = this.maxDateObj();
    if (min && year === min.getFullYear() && newMonth < min.getMonth()) newMonth = min.getMonth();
    if (max && year === max.getFullYear() && newMonth > max.getMonth()) newMonth = max.getMonth();

    this.viewDate.set(new Date(year, newMonth, 1));
    this.pickerView.set('month');
  }

  isDayDisabled(dateStr: string): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  }

  selectDay(day: CalendarDay): void {
    if (this.isDayDisabled(day.date)) return;
    this.daySelected.emit(day);
  }

  isSelected(date: string): boolean {
    if (this.pendingStart()) return date === this.pendingStart();
    if (!this.isRange()) return date === this.selected();
    return date === this.rangeStart() || date === this.rangeEnd();
  }

  isRangeStart(date: string): boolean {
    if (!this.isRange()) return false;
    return date === (this.pendingStart() || this.rangeStart());
  }

  isRangeEnd(date: string): boolean {
    if (!this.isRange() || this.pendingStart()) return false;
    return date === this.rangeEnd();
  }

  isInRange(date: string): boolean {
    if (!this.isRange() || this.pendingStart()) return false;
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || !end) return false;
    return date > start && date < end;
  }
}
