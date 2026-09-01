import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent, CardComponent, CurrencyDisplayComponent } from 'ibid-ui';
import { I18nService } from '@ibid/services';

@Component({
  imports: [RouterModule, ButtonComponent, CardComponent, CurrencyDisplayComponent],
  selector: 'ibid-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly sampleBalance = 1284.5;
}
