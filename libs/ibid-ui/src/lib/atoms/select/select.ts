import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export type DropdownPosition =
  'top-center' | 'top-left' | 'top-right' | 'bottom-center' | 'bottom-left' | 'bottom-right';
export type DropdownWidth = 'match-button' | 'content' | number;

const VIEWPORT_EDGE_GUTTER = 8;

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-select',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, HandDrawnDirective],
  template: `
    <mat-form-field
      appearance="outline"
      class="a-select-field"
      subscriptSizing="dynamic"
      [ibidHandDrawn]="1"
    >
      <mat-select
        [value]="value"
        (selectionChange)="onSelectionChange($event)"
        (opened)="onOpened()"
        disableOptionCentering
        [disabled]="disabled"
        [placeholder]="placeholder"
        [panelClass]="panelClasses"
      >
        @for (opt of options; track opt.value) {
          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
        }
      </mat-select>
      <div matSuffix class="a-select-field__custom-arrow" [class.is-open]="isOpen"></div>
    </mat-form-field>
  `,
  styleUrl: './select.scss',
})
export class SelectComponent<T = string> {
  @Input() value: T | '' = '';
  @Input() options: SelectOption<T>[] = [];
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() isOpen = false;
  @Input() size: 'full' | 'fixed' | 'content' | number = 'content';
  @Input() dropdownWidth: DropdownWidth = 'content';
  @Input() dropdownPosition: DropdownPosition = 'bottom-left';

  protected uniqueId = `select-panel-${Math.random().toString(36).substring(2, 9)}`;

  @HostBinding('class.a-select--full') get isFullWidth(): boolean {
    return this.size === 'full';
  }

  @HostBinding('class.a-select--fixed') get isFixedWidth(): boolean {
    return this.size === 'fixed';
  }

  @HostBinding('style.width') get hostWidth(): string | null {
    return typeof this.size === 'number' ? `${this.size}px` : null;
  }

  get panelClasses() {
    return [
      'm-dropdown-panel',
      this.uniqueId,
      `pos-${this.dropdownPosition}`,
      `width-${this.dropdownWidth}`,
    ];
  }

  @Output() valueChange = new EventEmitter<T>();

  protected onSelectionChange(event: MatSelectChange<T>): void {
    this.valueChange.emit(event.value);
  }

  protected onOpened(): void {
    setTimeout(() => {
      const panel = document.querySelector(`.${this.uniqueId}`) as HTMLElement | null;
      if (!panel) return;
      const pane = panel.closest('.cdk-overlay-pane') as HTMLElement | null;
      if (pane) {
        pane.style.width = 'max-content';
        pane.style.minWidth = 'max-content';
        pane.style.maxWidth = '80vw';
      }
      this.applyPanelWidth(panel);
      this.applyHorizontalAlignment(panel);
    });
  }

  private applyPanelWidth(panel: HTMLElement): void {
    if (typeof this.dropdownWidth === 'number') {
      const width = `${this.dropdownWidth}px`;
      panel.style.minWidth = width;
      panel.style.width = width;
      panel.style.maxWidth = '80vw';
      return;
    }
    if (this.dropdownWidth === 'content') {
      panel.style.minWidth = 'max-content';
      panel.style.width = 'max-content';
      panel.style.maxWidth = '80vw';
      return;
    }
    if (this.dropdownWidth === 'match-button') {
      panel.style.minWidth = '100%';
      panel.style.width = '100%';
      panel.style.maxWidth = '80vw';
    }
  }

  private applyHorizontalAlignment(panel: HTMLElement): void {
    const alignment = this.dropdownPosition.split('-')[1];
    if (alignment !== 'right' && alignment !== 'center') return;

    const pane = panel.closest('.cdk-overlay-pane') as HTMLElement | null;
    if (!pane) return;

    const paneBox = pane.getBoundingClientRect();
    const panelWidth = panel.getBoundingClientRect().width;
    const overhang = panelWidth - paneBox.width;
    if (overhang <= 0) return;

    const shift = alignment === 'right' ? overhang : overhang / 2;
    const resultingLeft = paneBox.left - shift;
    const clampedShift =
      resultingLeft < VIEWPORT_EDGE_GUTTER ? paneBox.left - VIEWPORT_EDGE_GUTTER : shift;

    panel.style.marginLeft = `-${Math.max(0, clampedShift)}px`;
  }
}
