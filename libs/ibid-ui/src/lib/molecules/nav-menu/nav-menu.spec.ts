import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavMenuComponent, NavMenuItem } from './nav-menu';

describe('NavMenuComponent', () => {
  let fixture: ComponentFixture<NavMenuComponent>;

  const items: readonly NavMenuItem[] = [
    { id: 'dashboard', type: 'link', label: 'Dashboard', route: '/', icon: 'add' },
    {
      id: 'categories',
      type: 'group',
      label: 'Categories',
      icon: 'add',
      emptyLabel: 'No categories',
      children: [{ id: 'food', type: 'link', label: 'Food', route: '/food' }]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMenuComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(NavMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  it('renders one entry per item', () => {
    expect(fixture.nativeElement.querySelectorAll('.m-nav-menu__list > .m-nav-menu__item').length).toBe(2);
  });

  it('keeps groups collapsed until they are toggled', () => {
    expect(fixture.nativeElement.querySelector('.m-nav-menu__sub-list')).toBeNull();

    fixture.nativeElement.querySelector('.m-nav-menu__link--group').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.m-nav-menu__sub-list')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.m-nav-menu__link--child').textContent).toContain('Food');
  });

  it('reports the expanded state to assistive technology', () => {
    const group: HTMLButtonElement = fixture.nativeElement.querySelector('.m-nav-menu__link--group');
    expect(group.getAttribute('aria-expanded')).toBe('false');

    group.click();
    fixture.detectChanges();
    expect(group.getAttribute('aria-expanded')).toBe('true');
  });

  it('emits the link that was selected', () => {
    let selected: string | undefined;
    fixture.componentInstance.itemSelected.subscribe(link => (selected = link.id));

    fixture.nativeElement.querySelector('.m-nav-menu__link').click();
    expect(selected).toBe('dashboard');
  });
});
