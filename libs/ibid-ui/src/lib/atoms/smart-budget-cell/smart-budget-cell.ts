import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '@ibid/services';
import { HandDrawnDirective, HandDrawnIntensity } from '../../directives/hand-drawn.directive';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'ibid-smart-budget-cell',
  standalone: true,
  imports: [HandDrawnDirective, IconComponent],
  template: `
    <span class="a-smart-budget-cell"
      [ibidHandDrawn]="handDrawn()"
      [class.a-smart-budget-cell--project]="!!projectName()"
      [class.a-smart-budget-cell--uncategorized]="!projectName() && !effectiveColor()"
      [style.--category-color]="projectName() ? null : effectiveColor()"
      [style.--glass-tint]="glassColor() || effectiveColor()"
    >
      @if (projectName()) {
        <ibid-icon name="piggy-bank" class="a-smart-budget-cell__project-icon"></ibid-icon>
        <span class="a-smart-budget-cell__project-name">{{ projectName() }}</span>
        <span class="a-smart-budget-cell__category">{{ categoryLabel() }}</span>
      } @else {
        <span class="a-smart-budget-cell__category-label">{{ categoryLabel() }}</span>
      }
      @if (showChevron()) {
        <ibid-icon name="chevron-down" class="a-smart-budget-cell__chevron"></ibid-icon>
      }
    </span>
  `,
  styleUrl: './smart-budget-cell.scss'
})
export class SmartBudgetCellComponent {
  private readonly i18n = inject(I18nService);

  readonly categoryId = input<string | undefined>(undefined);
  readonly categoryColor = input<string | undefined>(undefined);
  readonly glassColor = input<string | undefined>(undefined);
  readonly handDrawn = input<HandDrawnIntensity>(2);
  readonly projectName = input<string | undefined>(undefined);
  readonly showChevron = input(false);
  readonly categoryName = input('');

  protected readonly effectiveColor = computed(() => this.glassColor() || this.categoryColor());

  protected readonly categoryLabel = computed(
    () => this.categoryName() || this.i18n.translate('categoryUncategorizedLabel', 'Sem categoria')
  );

  protected readonly label = computed(() => this.projectName() ?? this.categoryLabel());
}
