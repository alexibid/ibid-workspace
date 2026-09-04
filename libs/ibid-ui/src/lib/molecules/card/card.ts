import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandDrawnDirective, HandDrawnIntensity } from '../../directives/hand-drawn.directive';

@Component({
  selector: 'ibid-card',
  standalone: true,
  imports: [CommonModule, HandDrawnDirective],
  template: `
    <div class="m-card" [ngClass]="customClass" [class.m-card--full-bleed-mobile]="fullBleedMobile" [ibidHandDrawn]="intensity">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './card.scss'
})
export class CardComponent {
  @Input() customClass = '';
  @Input() fullBleedMobile = false;
  @Input() intensity: HandDrawnIntensity = 3;
}

