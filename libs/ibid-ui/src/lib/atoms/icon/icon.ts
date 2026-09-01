import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { AppIconRegistry } from './icon-registry.service';

@Component({
  selector: 'ibid-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="a-icon" [ngClass]="iconClass" [innerHTML]="svgContent()"></span>`,
  styleUrl: './icon.scss'
})
export class IconComponent implements OnChanges {
  @Input({ required: true }) name!: string;
  @Input() iconClass = '';

  private registry = inject(AppIconRegistry);
  readonly svgContent = signal<SafeHtml>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name'] && this.name) {
      this.registry.getIcon(this.name).subscribe(svg => {
        this.svgContent.set(svg);
      });
    }
  }
}
