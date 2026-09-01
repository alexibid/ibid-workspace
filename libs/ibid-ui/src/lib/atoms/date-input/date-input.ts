import { IconComponent } from '../icon/icon';
import { Component, EventEmitter, Output, computed, input, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CalendarDay, buildMonthGrid, formatDateDisplay, formatDateLocal, parseLocalDate } from '@ibid/utils';

export interface DateRangeValue {
  start: string;
  end: string;
}

const CALENDAR_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 }
];

const EARLIEST_SELECTABLE_YEAR = 1900;
const LATEST_SELECTABLE_YEAR = 2100;

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule, IconComponent, OverlayModule],
  template: `
    <div class="a-date-input-wrapper"
      [class.is-single]="effectiveMode === 'single'"
      [class.is-range]="effectiveMode === 'range'">
      
      <button
        #trigger="cdkOverlayOrigin"
        cdkOverlayOrigin
        type="button"
        class="a-date-input__trigger"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span class="a-date-input__text">
          <span class="a-date-input__part">
            <span class="a-date-input__day-month">{{ startPart().dayMonth }}</span>
            <span class="a-date-input__year">{{ startPart().year }}</span>
          </span>
          @if (hasRangeEnd()) {
            <span class="a-date-input__separator">–</span>
            <span class="a-date-input__part">
              <span class="a-date-input__day-month">{{ endPart().dayMonth }}</span>
              <span class="a-date-input__year">{{ endPart().year }}</span>
            </span>
          }
        </span>
        <app-icon name="calendar"></app-icon>
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayHasBackdrop]="false"
        [cdkConnectedOverlayPush]="false"
        [cdkConnectedOverlayViewportMargin]="8"
        (overlayOutsideClick)="close()"
      >
        <div class="a-date-input__popover">
          <header class="a-date-input__nav">
            <button type="button" class="a-date-input__nav-btn" (click)="previous()" [disabled]="!canGoPrevious()">
              <app-icon name="chevron-left"></app-icon>
            </button>
            <div class="a-date-input__nav-center">
              <button type="button" class="a-date-input__nav-center-btn" (click)="setPickerView('month')">{{ currentMonthName() }}</button>
              <button type="button" class="a-date-input__nav-center-btn" (click)="setPickerView('year')">{{ currentYearName() }}</button>
            </div>
            <button type="button" class="a-date-input__nav-btn" (click)="next()" [disabled]="!canGoNext()">
              <app-icon name="chevron-right"></app-icon>
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
      </ng-template>
    </div>
  `,
  styleUrl: './date-input.scss'
})
export class DateInputComponent {
  protected readonly positions = CALENDAR_POSITIONS;

  readonly value = input<string>('');
  readonly startDate = input<string>('');
  readonly endDate = input<string>('');
  readonly isRange = input<boolean>(false);
  readonly mode = input<'single' | 'range'>('single');
  readonly disabled = input<boolean>(false);
  readonly minDate = input<string>('');
  readonly maxDate = input<string>('');

  @Output() valueChange = new EventEmitter<string>();
  @Output() rangeChange = new EventEmitter<DateRangeValue>();
  @Output() change = new EventEmitter<string | DateRangeValue>();

  private readonly localValue = signal<string | null>(null);
  private readonly localStart = signal<string | null>(null);
  private readonly localEnd = signal<string | null>(null);

  protected readonly currentSingleValue = computed(() => this.localValue() ?? this.value());
  protected readonly currentStartDate = computed(() => this.localStart() ?? this.startDate() ?? this.value());
  protected readonly currentEndDate = computed(() => this.localEnd() ?? this.endDate());

  protected get effectiveMode(): 'single' | 'range' {
    return this.isRange() || this.mode() === 'range' ? 'range' : 'single';
  }

  protected readonly isOpen = signal(false);
  protected readonly pendingStart = signal<string | null>(null);
  protected readonly pickerView = signal<'date' | 'month' | 'year'>('date');
  protected readonly viewDate = signal(new Date());

  protected readonly weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  protected readonly today = formatDateLocal(new Date());

  protected readonly formattedDisplay = computed(() => {
    if (this.effectiveMode === 'single') {
      const val = this.currentSingleValue();
      if (!val) return 'DD/MM/YYYY';
      return this.formatDateStr(val);
    }

    const start = this.currentStartDate();
    const end = this.currentEndDate();
    if (start && end) {
      return `${this.formatDateStr(start)} – ${this.formatDateStr(end)}`;
    }
    if (start) {
      return this.formatDateStr(start);
    }
    return 'DD/MM/YYYY';
  });

  protected readonly startPart = computed(() =>
    this.splitDatePart(this.effectiveMode === 'single' ? this.currentSingleValue() : this.currentStartDate())
  );

  protected readonly endPart = computed(() => this.splitDatePart(this.currentEndDate()));

  protected readonly hasRangeEnd = computed(() =>
    this.effectiveMode !== 'single' && !!this.currentEndDate()
  );

  private splitDatePart(dateStr: string | null | undefined): { dayMonth: string; year: string } {
    if (!dateStr) return { dayMonth: 'DD/MM', year: '' };
    const [day, month, year] = this.formatDateStr(dateStr).split('/');
    return { dayMonth: `${day}/${month}`, year: year ?? '' };
  }

  private formatDateStr(dateStr: string): string {
    return formatDateDisplay(dateStr);
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

  protected readonly minDateObj = computed(() => this.minDate() ? parseLocalDate(this.minDate()) : null);
  protected readonly maxDateObj = computed(() => this.maxDate() ? parseLocalDate(this.maxDate()) : null);

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

  toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
      return;
    }

    const initialStr = this.effectiveMode === 'single'
      ? this.currentSingleValue()
      : (this.currentStartDate() || this.currentSingleValue());

    if (initialStr && initialStr.trim().length > 0) {
      const parsed = parseLocalDate(initialStr);
      if (!isNaN(parsed.getTime())) {
        this.viewDate.set(parsed);
      } else {
        this.viewDate.set(new Date());
      }
    } else {
      this.viewDate.set(new Date());
    }

    this.pickerView.set('date');
    this.pendingStart.set(null);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.pendingStart.set(null);
  }

  setPickerView(view: 'date' | 'month' | 'year'): void {
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

    if (this.effectiveMode === 'single') {
      this.localValue.set(day.date);
      this.valueChange.emit(day.date);
      this.change.emit(day.date);
      this.close();
      return;
    }

    const pending = this.pendingStart();
    if (!pending) {
      this.pendingStart.set(day.date);
      return;
    }

    const [start, end] = day.date < pending ? [day.date, pending] : [pending, day.date];
    this.localStart.set(start);
    this.localEnd.set(end);
    this.pendingStart.set(null);
    this.close();
    this.valueChange.emit(start);
    this.rangeChange.emit({ start, end });
    this.change.emit({ start, end });
  }

  isSelected(date: string): boolean {
    if (this.pendingStart()) return date === this.pendingStart();
    if (this.effectiveMode === 'single') return date === this.currentSingleValue();
    const start = this.currentStartDate();
    const end = this.currentEndDate();
    return date === start || date === end;
  }

  isRangeStart(date: string): boolean {
    if (this.effectiveMode === 'single') return false;
    const start = this.pendingStart() || this.currentStartDate();
    return date === start;
  }

  isRangeEnd(date: string): boolean {
    if (this.effectiveMode === 'single' || this.pendingStart()) return false;
    return date === this.currentEndDate();
  }

  isInRange(date: string): boolean {
    if (this.effectiveMode === 'single' || this.pendingStart()) return false;
    const start = this.currentStartDate();
    const end = this.currentEndDate();
    if (!start || !end) return false;
    return date > start && date < end;
  }
}
