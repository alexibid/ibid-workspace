import { Component, ViewEncapsulation, booleanAttribute, input } from '@angular/core';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  readonly expanded = input(false, { transform: booleanAttribute });
}
