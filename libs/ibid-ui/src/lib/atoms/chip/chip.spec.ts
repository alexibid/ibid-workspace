import { TestBed } from '@angular/core/testing';
import { ChipComponent } from './chip';

describe('ChipComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ChipComponent] }));

  function render(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(ChipComponent);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('renders its label', () => {
    const fixture = render({ label: 'Casa' });

    expect(fixture.nativeElement.textContent).toContain('Casa');
  });

  it('reports its selection state to assistive technology', () => {
    const fixture = render({ label: 'Casa', selected: true });

    const control = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(control.getAttribute('aria-pressed')).toBe('true');
    expect(control.classList).toContain('a-chip__control--selected');
  });

  it('emits the opposite of its current state when pressed', () => {
    const fixture = render({ label: 'Casa' });
    const emitted: boolean[] = [];
    fixture.componentInstance.selectedChange.subscribe((value) => emitted.push(value));

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toEqual([true]);
  });

  it('renders an icon only when one is given', () => {
    expect(render({ label: 'Casa' }).nativeElement.querySelector('ibid-icon')).toBeNull();
    expect(
      render({ label: 'Casa', icon: 'house' }).nativeElement.querySelector('ibid-icon')
    ).not.toBeNull();
  });
});
