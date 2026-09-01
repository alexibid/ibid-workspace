import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '@ibid/services';
import { pickAccessibleTextColor } from '@ibid/utils';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'ibid-smart-budget-cell',
  standalone: true,
  imports: [IconComponent],
  template: `
    <span class="a-smart-budget-cell"
      [class.a-smart-budget-cell--project]="!!projectName()"
      [class.a-smart-budget-cell--uncategorized]="!projectName() && !categoryColor()"
      [style.--category-color]="projectName() ? null : categoryColor()"
      [style.color]="textColor()"
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
  readonly projectName = input<string | undefined>(undefined);
  readonly showChevron = input(false);
  readonly categoryName = input('');

  protected readonly textColor = computed(() => {
    if (this.projectName()) return null;
    const color = this.categoryColor();
    return color ? pickAccessibleTextColor(color) : null;
  });

  protected readonly categoryLabel = computed(
    () => this.categoryName() || this.i18n.translate('categoryUncategorizedLabel', 'Sem categoria')
  );

  protected readonly label = computed(() => this.projectName() ?? this.categoryLabel());
}
