import { Component } from '@angular/core';
import {
  CardComponent,
  DividerComponent,
  EmptyStateComponent,
  LegendItemComponent,
  ProgressRowComponent,
  StackDotsComponent,
  StatIconComponent,
  SummaryRowComponent
} from 'ibid-ui';

@Component({
  selector: 'boilerplate-layout-page',
  standalone: true,
  imports: [
    CardComponent,
    DividerComponent,
    EmptyStateComponent,
    LegendItemComponent,
    ProgressRowComponent,
    StackDotsComponent,
    StatIconComponent,
    SummaryRowComponent
  ],
  templateUrl: './layout.page.html'
})
export class LayoutPage {}
