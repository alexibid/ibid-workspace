import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ibid-collection-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collection-list.html',
  styleUrl: './collection-list.scss'
})
export class CollectionListComponent {
  @Input() gap: 'none' | 'xs' | 'sm' | 'md' | 'lg' = 'xs';
  @Input() customClass = '';
}
