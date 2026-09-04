import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  model,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandDrawnDirective, HandDrawnIntensity } from '../../directives/hand-drawn.directive';
import { IconComponent } from '../../atoms/icon/icon';

export interface ToggleTabItem<T = string | number> {
  readonly value: T;
  readonly label: string;
  readonly icon?: string;
  readonly badge?: string | number;
  readonly color?: string;
  readonly disabled?: boolean;
}

export type ToggleTabsSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ibid-toggle-tabs',
  standalone: true,
  imports: [CommonModule, HandDrawnDirective, IconComponent],
  templateUrl: './toggle-tabs.html',
  styleUrl: './toggle-tabs.scss'
})
export class ToggleTabsComponent<T extends string | number = string | number> implements AfterViewInit {
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  @ViewChild('tabList', { static: false })
  private readonly tabListRef?: ElementRef<HTMLElement>;

  readonly items = input.required<readonly ToggleTabItem<T>[]>();
  readonly value = model.required<T>();
  readonly size = input<ToggleTabsSize>('md');
  readonly color = input<string | undefined>(undefined);
  readonly contour = input<HandDrawnIntensity>(2);
  readonly ariaLabel = input('Segmented tab navigation');

  protected readonly indicatorLeft = signal(0);
  protected readonly indicatorWidth = signal(0);
  protected readonly indicatorVisible = signal(false);

  protected readonly activeItem = computed(() => {
    const val = this.value();
    return this.items().find(item => item.value === val);
  });

  protected readonly activeColor = computed(() => {
    return this.activeItem()?.color || this.color();
  });

  constructor() {
    effect(() => {
      this.value();
      this.items();
      this.updateIndicator();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateIndicator(), 0);
  }

  protected selectTab(item: ToggleTabItem<T>): void {
    if (item.disabled) return;
    this.value.set(item.value);
  }

  protected onKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const enabledItems = this.items()
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled);

    if (enabledItems.length === 0) return;

    let targetIndex: number | undefined;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        const next = enabledItems.find(({ index }) => index > currentIndex);
        targetIndex = next ? next.index : enabledItems[0].index;
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        const prev = [...enabledItems].reverse().find(({ index }) => index < currentIndex);
        targetIndex = prev ? prev.index : enabledItems[enabledItems.length - 1].index;
        break;
      }
      case 'Home': {
        event.preventDefault();
        targetIndex = enabledItems[0].index;
        break;
      }
      case 'End': {
        event.preventDefault();
        targetIndex = enabledItems[enabledItems.length - 1].index;
        break;
      }
    }

    if (targetIndex !== undefined) {
      const targetItem = this.items()[targetIndex];
      this.selectTab(targetItem);
      this.focusTab(targetIndex);
    }
  }

  private focusTab(index: number): void {
    const container = this.tabListRef?.nativeElement || this.hostRef.nativeElement;
    const buttons = Array.from(container.querySelectorAll('.m-toggle-tabs__tab')) as HTMLButtonElement[];
    if (buttons[index]) {
      buttons[index].focus();
    }
  }

  protected updateIndicator(): void {
    const container = this.tabListRef?.nativeElement || this.hostRef.nativeElement.querySelector('.m-toggle-tabs');
    if (!container) return;

    const val = this.value();
    const activeIndex = this.items().findIndex(i => i.value === val);
    const buttons = Array.from(container.querySelectorAll('.m-toggle-tabs__tab')) as HTMLButtonElement[];

    if (activeIndex >= 0 && buttons[activeIndex]) {
      const activeBtn = buttons[activeIndex];
      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;
      this.indicatorLeft.set(left);
      this.indicatorWidth.set(width);
      this.indicatorVisible.set(true);
    } else {
      this.indicatorVisible.set(false);
    }
  }
}

