import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { I18nService } from '@ibid/services';
import { PAPER_PET } from '@domain/data/paper-models';
import { DiaryStore } from '@application/services/diary-store';
import { PaperModelComponent } from '@ui/organisms/paper-model/paper-model';

@Component({
  selector: 'camila-home-page',
  standalone: true,
  imports: [PaperModelComponent, RouterModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(DiaryStore);
  protected readonly model = PAPER_PET;

  constructor() {
    void this.store.load();
  }
}
