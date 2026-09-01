import { IconComponent } from '../../atoms/icon/icon';
import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { I18N_SHARED, I18nService } from '@ibid/services';

const BALLOON_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 }
];

@Component({
  selector: 'ibid-info-balloon',
  standalone: true,
  imports: [CommonModule, OverlayModule, IconComponent, I18N_SHARED],
  templateUrl: './info-balloon.html',
  styleUrl: './info-balloon.scss'
})
export class InfoBalloonComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly positions = BALLOON_POSITIONS;

  readonly iconName = input('info');
  readonly title = input.required<string>();
  readonly message = input.required<string>();

  protected readonly isOpen = signal(false);

  protected readonly closeLabel = computed(() => this.i18n.translate('infoBalloonClose'));

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen()) this.close();
  }
}
