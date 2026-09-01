import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

@Component({
  selector: 'ibid-card',
  standalone: true,
  imports: [CommonModule, HandDrawnDirective],
  template: `
    <div class="m-card" [ngClass]="customClass" [class.m-card--full-bleed-mobile]="fullBleedMobile" ibidHandDrawn>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './card.scss'
})
export class CardComponent {
  @Input() customClass = '';
  @Input() fullBleedMobile = false;
}
