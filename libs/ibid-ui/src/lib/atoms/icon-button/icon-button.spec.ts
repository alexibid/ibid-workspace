import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button';

describe('IconButtonComponent', () => {
  let component: IconButtonComponent;
  let fixture: ComponentFixture<IconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits onClick with the native MouseEvent when clicked', () => {
    const emitSpy = vi.spyOn(component.onClick, 'emit');
    fixture.nativeElement.querySelector('button').click();

    expect(emitSpy).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('forwards ariaLabel to the native button for accessibility', () => {
    fixture.componentRef.setInput('ariaLabel', 'Show assistant suggestions');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Show assistant suggestions');
  });

  it('always renders type="button" so it never triggers a form submission', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.type).toBe('button');
  });
});
