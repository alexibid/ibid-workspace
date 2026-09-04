import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { HandDrawnDirective, HandDrawnIntensity } from '../../directives/hand-drawn.directive';
import { IconComponent } from '../../atoms/icon/icon';
import { SmartBudgetCellComponent } from '../../atoms/smart-budget-cell/smart-budget-cell';

export interface SearchableSelectOption<T = string> {
  value: T;
  label: string;
  color?: string;
  icon?: string;
  selected?: boolean;
}

export interface SearchableSelectGroup<T = string> {
  title: string;
  options: SearchableSelectOption<T>[];
  mode?: 'single' | 'checkbox';
}

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 }
];

@Component({
  selector: 'ibid-searchable-select',
  standalone: true,
  imports: [
    CommonModule,
    OverlayModule,
    HandDrawnDirective,
    IconComponent,
    SmartBudgetCellComponent
  ],
  templateUrl: './searchable-select.html',
  styleUrl: './searchable-select.scss'
})
export class SearchableSelectComponent<T = string> {
  protected readonly positions = POSITIONS;

  @Input() value: T | '' = '';
  @Input() label?: string;
  @Input() color?: string;
  @Input() glassColor?: string;
  @Input() handDrawn: HandDrawnIntensity = 2;
  @Input() projectName?: string;
  @Input() placeholder = '';
  @Input() searchPlaceholder = 'Pesquisar...';
  @Input() ariaLabel = 'Select';
  @Input() options: SearchableSelectOption<T>[] = [];
  @Input() groups: SearchableSelectGroup<T>[] = [];
  @Input() createOptionLabel?: string;
  @Input() showCreateOption = false;
  @Input() disabled = false;
  @Input() assistantSuggested = false;

  @Output() valueChange = new EventEmitter<T>();
  @Output() groupToggle = new EventEmitter<{ group: SearchableSelectGroup<T>; option: SearchableSelectOption<T> }>();
  @Output() createClick = new EventEmitter<void>();

  @ViewChild('searchInput') private readonly searchInput?: ElementRef<HTMLInputElement>;

  protected readonly searchMode = signal(false);
  protected readonly searchQuery = signal('');

  protected readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.options;
    return this.options.filter(opt => opt.label.toLowerCase().includes(query));
  });

  protected readonly filteredGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.groups;
    return this.groups
      .map(g => ({
        ...g,
        options: g.options.filter(opt => opt.label.toLowerCase().includes(query))
      }))
      .filter(g => g.options.length > 0);
  });

  protected openSearch(): void {
    if (this.disabled) return;
    this.searchMode.set(true);
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  protected closeSearch(): void {
    this.searchMode.set(false);
    this.searchQuery.set('');
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected selectOption(val: T): void {
    this.value = val;
    this.closeSearch();
    this.valueChange.emit(val);
  }

  protected toggleGroupOption(group: SearchableSelectGroup<T>, option: SearchableSelectOption<T>): void {
    this.groupToggle.emit({ group, option });
  }

  protected onCreateClick(): void {
    this.closeSearch();
    this.createClick.emit();
  }
}
