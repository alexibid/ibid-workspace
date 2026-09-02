import { Component } from '@angular/core';
import {
  ButtonComponent,
  CardComponent,
  FeatureDisplayComponent,
  HandDrawnDirective,
  StatCardComponent,
} from 'ibid-ui';
import {
  MOCK_HAND_DRAWN_EXPENSES,
  MOCK_HAND_DRAWN_INCOME,
  MOCK_HAND_DRAWN_SAVINGS
} from './hand-drawn.page.mock';

@Component({
  selector: 'boilerplate-hand-drawn-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    FeatureDisplayComponent,
    HandDrawnDirective,
    StatCardComponent,
  ],
  templateUrl: './hand-drawn.page.html',
  styleUrl: './hand-drawn.page.scss',
})
export class HandDrawnPage {
  protected readonly incomeStat = MOCK_HAND_DRAWN_INCOME;
  protected readonly expenseStat = MOCK_HAND_DRAWN_EXPENSES;
  protected readonly savingsStat = MOCK_HAND_DRAWN_SAVINGS;
}
