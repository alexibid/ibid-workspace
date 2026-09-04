import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleTabItem, ToggleTabsComponent } from './toggle-tabs';

describe('ToggleTabsComponent', () => {
  let component: ToggleTabsComponent<string>;
  let fixture: ComponentFixture<ToggleTabsComponent<string>>;

  const mockItems: ToggleTabItem<string>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos', badge: 3 },
    { value: 'executed', label: 'Executados' },
    { value: 'cancelled', label: 'Desistidos', disabled: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleTabsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleTabsComponent<string>);
    fixture.componentRef.setInput('items', mockItems);
    fixture.componentRef.setInput('value', 'all');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render tabs', () => {
    expect(component).toBeTruthy();
    const tabs = fixture.nativeElement.querySelectorAll('.m-toggle-tabs__tab');
    expect(tabs.length).toBe(4);
    expect(tabs[0].classList.contains('m-toggle-tabs__tab--active')).toBe(true);
    expect(tabs[1].textContent).toContain('3');
  });

  it('should update active tab on click', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.m-toggle-tabs__tab');
    tabs[1].click();
    fixture.detectChanges();

    expect(component.value()).toBe('active');
  });

  it('should not select disabled tabs', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.m-toggle-tabs__tab');
    tabs[3].click();
    fixture.detectChanges();

    expect(component.value()).toBe('all');
  });

  it('should navigate through tabs with arrow keys', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.m-toggle-tabs__tab');
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(component.value()).toBe('active');
  });
});
