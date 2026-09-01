import { Component } from '@angular/core';
import { ButtonComponent, IconButtonComponent, IconComponent, ViewMoreLinkComponent } from 'ibid-ui';

@Component({
  selector: 'boilerplate-actions-page',
  standalone: true,
  imports: [ButtonComponent, IconButtonComponent, IconComponent, ViewMoreLinkComponent],
  templateUrl: './actions.page.html'
})
export class ActionsPage {}
