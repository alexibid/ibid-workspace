import { Component, Input, inject } from '@angular/core';
import { IconComponent } from '../icon/icon';
import { Router } from '@angular/router';
import { I18N_SHARED } from '@ibid/services';

@Component({
  selector: 'app-view-more-link',
  standalone: true,
  imports: [IconComponent, ...I18N_SHARED],
  template: `
    <button type="button" class="a-view-more-link" (click)="navigate($event)">
      <app-icon name="link" class="a-view-more-link__icon"></app-icon>
      <span>{{ 'viewMoreBtn' | translate }}</span>
    </button>
  `,
  styleUrl: './view-more-link.scss'
})
export class ViewMoreLinkComponent {
  private readonly router = inject(Router);

  @Input() accountId?: string;

  navigate(event: Event): void {
    event.stopPropagation();
    const queryParams = this.accountId ? { accountId: this.accountId } : {};
    this.router.navigate(['/movements'], { queryParams });
  }
}
