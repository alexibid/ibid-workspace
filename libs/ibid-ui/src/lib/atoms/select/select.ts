import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export type DropdownPosition =
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right';
export type DropdownWidth = 'match-button' | 'content' | number;

const POSITIONS_BOTTOM_LEFT: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 }
];

const POSITIONS_BOTTOM_RIGHT: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 }
];

const POSITIONS_TOP_LEFT: ConnectedPosition[] = [
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 }
];

const POSITIONS_TOP_RIGHT: ConnectedPosition[] = [
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 }
];

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-select',
  standalone: true,
  imports: [CommonModule, OverlayModule, HandDrawnDirective],
  template: `
    <div
      class="a-select"
      [class.a-select--full]="size === 'full'"
      [class.a-select--fixed]="size === 'fixed'"
      [style.width]="hostWidth"
    >
      <button
        #triggerBtn="cdkOverlayOrigin"
        cdkOverlayOrigin
        [ibidHandDrawn]="3"
        type="button"
        class="a-select__trigger a-select-field"
        [class.is-open]="isOpen"
        [disabled]="disabled"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        (keydown.space)="onSpaceKey($event)"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen"
      >
        <span class="a-select__value">{{ selectedLabel }}</span>
        <span class="a-select__arrow" [class.is-open]="isOpen" aria-hidden="true"></span>
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="triggerBtn"
        [cdkConnectedOverlayOpen]="isOpen"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayHasBackdrop]="false"
        [cdkConnectedOverlayPush]="false"
        [cdkConnectedOverlayViewportMargin]="8"
        [cdkConnectedOverlayMinWidth]="dropdownMinWidth"
        (overlayOutsideClick)="close()"
      >
        <div
          class="a-select__popover m-dropdown-panel mat-mdc-select-panel"
          [class]="panelClasses"
          [style.width]="popoverWidth"
          [ibidHandDrawn]="3"
          role="listbox"
          tabindex="-1"
          (keydown.escape)="close()"
        >
          @for (opt of options; track opt.value) {
            <button
              type="button"
              role="option"
              class="a-select__option mat-option mat-mdc-option"
              [class.is-selected]="opt.value === value"
              [class.mdc-list-item--selected]="opt.value === value"
              [attr.aria-selected]="opt.value === value"
              (click)="selectOption(opt.value)"
            >
              <span class="a-select__option-label mdc-list-item__primary-text">{{ opt.label }}</span>
            </button>
          }
        </div>
      </ng-template>
    </div>
  `,
  styleUrl: './select.scss',
})
export class SelectComponent<T = string> {
  @ViewChild('triggerBtn', { read: ElementRef }) triggerEl?: ElementRef<HTMLElement>;

  @Input() value: T | '' = '';
  @Input() options: SelectOption<T>[] = [];
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() isOpen = false;
  @Input() size: 'full' | 'fixed' | 'content' | number = 'content';
  @Input() dropdownWidth: DropdownWidth = 'content';
  @Input() dropdownPosition: DropdownPosition = 'bottom-left';

  @Output() valueChange = new EventEmitter<T>();

  @HostBinding('class.a-select--full') get isFullWidth(): boolean {
    return this.size === 'full';
  }

  @HostBinding('class.a-select--fixed') get isFixedWidth(): boolean {
    return this.size === 'fixed';
  }

  @HostBinding('style.width') get hostWidth(): string | null {
    return typeof this.size === 'number' ? `${this.size}px` : null;
  }

  get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? selected.label : this.placeholder;
  }

  get positions(): ConnectedPosition[] {
    if (this.dropdownPosition === 'bottom-right') return POSITIONS_BOTTOM_RIGHT;
    if (this.dropdownPosition === 'top-right') return POSITIONS_TOP_RIGHT;
    if (this.dropdownPosition === 'top-left') return POSITIONS_TOP_LEFT;
    return POSITIONS_BOTTOM_LEFT;
  }

  get dropdownMinWidth(): number | string {
    if (this.dropdownWidth === 'match-button' && this.triggerEl) {
      return this.triggerEl.nativeElement.offsetWidth;
    }
    return '';
  }

  get popoverWidth(): string {
    if (typeof this.dropdownWidth === 'number') {
      return `${this.dropdownWidth}px`;
    }
    return '';
  }

  get panelClasses(): string {
    return `pos-${this.dropdownPosition} width-${this.dropdownWidth}`;
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  open(): void {
    if (this.disabled) return;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  selectOption(val: T): void {
    this.value = val;
    this.valueChange.emit(val);
    this.close();
  }

  onSpaceKey(event: Event): void {
    event.preventDefault();
    this.toggle();
  }
}
