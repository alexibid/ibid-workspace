import { Component, computed, input } from '@angular/core';
import { HandDrawnDirective, HandDrawnIntensity } from '../../directives/hand-drawn.directive';
import { IconComponent } from '../icon/icon';

export type FeatureIconSize = 'sm' | 'md' | 'lg' | 'xl';
export type FeatureIconVariant = 'glass' | 'solid' | 'pastel';

@Component({
  selector: 'ibid-feature-icon',
  standalone: true,
  imports: [HandDrawnDirective, IconComponent],
  template: `
    <div
      class="a-feature-icon"
      [class.a-feature-icon--sm]="size() === 'sm'"
      [class.a-feature-icon--md]="size() === 'md'"
      [class.a-feature-icon--lg]="size() === 'lg'"
      [class.a-feature-icon--xl]="size() === 'xl'"
      [class.a-feature-icon--glass]="variant() === 'glass'"
      [class.a-feature-icon--solid]="variant() === 'solid'"
      [class.a-feature-icon--pastel]="variant() === 'pastel'"
      [ibidHandDrawn]="contour()"
      [style]="colorStyle()"
      [attr.role]="ariaLabel() ? 'img' : null"
      [attr.aria-label]="ariaLabel() || null"
    >
      <ibid-icon [name]="name()" />
    </div>
  `,
  styleUrl: './feature-icon.scss'
})
export class FeatureIconComponent {
  readonly name = input.required<string>();
  readonly color = input<string | undefined>(undefined);
  readonly size = input<FeatureIconSize>('md');
  readonly variant = input<FeatureIconVariant>('glass');
  readonly contour = input<HandDrawnIntensity>(2);
  readonly ariaLabel = input<string | undefined>(undefined);


  protected readonly colorStyle = computed(() => {
    const c = this.color();
    if (!c) return {};
    return {
      '--feature-icon-color': c
    };
  });
}
