import { HandDrawnDirective } from '../../directives/hand-drawn.directive';
import { Component, EventEmitter, Output, computed, input, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CalendarDay, formatDateDisplay } from '@ibid/utils';
import { DatePickerPanelComponent } from '../date-picker-panel/date-picker-panel';

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

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-date-input',
  standalone: true,
  imports: [CommonModule, OverlayModule, HandDrawnDirective, DatePickerPanelComponent],
  template: `
    <div class="a-date-input-wrapper"
      [class.is-single]="effectiveMode === 'single'"
      [class.is-range]="effectiveMode !== 'single'"
    >
      <button
        type="button"
        class="a-date-input__trigger"
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        [ibidHandDrawn]="2"
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
        <ibid-date-picker-panel
          [initialDate]="panelInitialDate()"
          [selected]="currentSingleValue()"
          [rangeStart]="currentStartDate()"
          [rangeEnd]="currentEndDate()"
          [pendingStart]="pendingStart()"
          [isRange]="effectiveMode !== 'single'"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          (daySelected)="selectDay($event)"
        ></ibid-date-picker-panel>
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
  @Output() dateChange = new EventEmitter<string | DateRangeValue>();

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

  protected readonly panelInitialDate = computed(() =>
    this.effectiveMode === 'single'
      ? this.currentSingleValue()
      : (this.currentStartDate() || this.currentSingleValue())
  );

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

  toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
      return;
    }

    this.pendingStart.set(null);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.pendingStart.set(null);
  }

  selectDay(day: CalendarDay): void {
    if (this.effectiveMode === 'single') {
      this.localValue.set(day.date);
      this.valueChange.emit(day.date);
      this.dateChange.emit(day.date);
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
    this.dateChange.emit({ start, end });
  }
}
