import { Component, ViewEncapsulation, booleanAttribute, input } from '@angular/core';
import { HandDrawnDirective } from '../../directives/hand-drawn.directive';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-header',
  standalone: true,
  imports: [HandDrawnDirective],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  readonly expanded = input(false, { transform: booleanAttribute });
}
