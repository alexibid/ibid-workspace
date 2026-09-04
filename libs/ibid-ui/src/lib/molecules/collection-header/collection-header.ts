import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../../atoms/search-input/search-input';
import { SegmentedControlComponent, SegmentOption } from '../segmented-control/segmented-control';

@Component({
  selector: 'ibid-collection-header',
  standalone: true,
  imports: [CommonModule, SearchInputComponent, SegmentedControlComponent],
  templateUrl: './collection-header.html',
  styleUrl: './collection-header.scss'
})
export class CollectionHeaderComponent {
  @Input() title = '';
  @Input() showTitle = true;
  @Input() showSearch = false;
  @Input() searchQuery = '';
  @Input() searchPlaceholder = '';
  @Input() clearLabel = '';
  @Input() showTabs = false;
  @Input() activeTab = '';
  @Input() tabOptions: readonly SegmentOption[] = [];
  @Input() sticky = false;
  @Input() compact = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<string>();
}
