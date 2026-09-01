import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation, input, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon';

export type NavMenuRoute = string | readonly (string | number)[];

export interface NavMenuLink {
  readonly id: string;
  readonly type: 'link';
  readonly label: string;
  readonly route: NavMenuRoute;
  readonly icon?: string;
  readonly color?: string;
  readonly exact?: boolean;
}

export interface NavMenuGroup {
  readonly id: string;
  readonly type: 'group';
  readonly label: string;
  readonly icon?: string;
  readonly emptyLabel?: string;
  readonly children: readonly NavMenuLink[];
}

export type NavMenuItem = NavMenuLink | NavMenuGroup;

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'ibid-nav-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss'
})
export class NavMenuComponent {
  readonly items = input.required<readonly NavMenuItem[]>();
  readonly expandLabel = input('Toggle section');
  readonly itemSelected = output<NavMenuLink>();

  private readonly expanded = signal<ReadonlySet<string>>(new Set<string>());

  protected isExpanded(group: NavMenuGroup): boolean {
    return this.expanded().has(group.id);
  }

  protected toggleGroup(group: NavMenuGroup): void {
    const next = new Set(this.expanded());
    if (next.has(group.id)) next.delete(group.id);
    else next.add(group.id);
    this.expanded.set(next);
  }

  protected selectLink(link: NavMenuLink): void {
    this.itemSelected.emit(link);
  }

  protected asGroup(item: NavMenuItem): NavMenuGroup {
    return item as NavMenuGroup;
  }

  protected asLink(item: NavMenuItem): NavMenuLink {
    return item as NavMenuLink;
  }
}
