import { Component, ViewEncapsulation, booleanAttribute, input, output } from '@angular/core';
import { ScrimComponent } from '../../atoms/scrim/scrim';

export type HeaderNavMode = 'inline' | 'overlay';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-header-nav',
  standalone: true,
  imports: [ScrimComponent],
  templateUrl: './header-nav.html',
  styleUrl: './header-nav.scss'
})
export class HeaderNavComponent {
  readonly open = input(false, { transform: booleanAttribute });
  readonly mode = input<HeaderNavMode>('inline');
  readonly drawerWidth = input('260px');
  readonly closeLabel = input('Close navigation');
  readonly showScrim = input(false, { transform: booleanAttribute });
  readonly closeRequested = output<void>();
}
