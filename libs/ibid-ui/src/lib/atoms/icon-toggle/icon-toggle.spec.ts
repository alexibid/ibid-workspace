import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconToggleComponent } from './icon-toggle';

describe('IconToggleComponent', () => {
  let component: IconToggleComponent;
  let fixture: ComponentFixture<IconToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconToggleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IconToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle checked state on click and emit checkedChange', () => {
    const spy = vi.fn();
    component.checkedChange.subscribe(spy);

    component.toggle();
    expect(component.checked).toBe(true);
    expect(spy).toHaveBeenCalledWith(true);

    component.toggle();
    expect(component.checked).toBe(false);
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should not toggle when disabled', () => {
    const spy = vi.fn();
    component.checkedChange.subscribe(spy);
    component.disabled = true;

    component.toggle();
    expect(component.checked).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
