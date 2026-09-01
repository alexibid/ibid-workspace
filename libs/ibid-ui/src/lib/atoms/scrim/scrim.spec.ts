import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrimComponent } from './scrim';

describe('ScrimComponent', () => {
  let fixture: ComponentFixture<ScrimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScrimComponent] }).compileComponents();
    fixture = TestBed.createComponent(ScrimComponent);
    fixture.detectChanges();
  });

  it('exposes an accessible dismissal control', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Close');
    expect(button.type).toBe('button');
  });

  it('emits when clicked', () => {
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));
    fixture.nativeElement.querySelector('button').click();
    expect(dismissed).toBe(true);
  });

  it('is dimmed by default and can be made transparent', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.classList).toContain('a-scrim--dimmed');

    fixture.componentRef.setInput('dimmed', false);
    fixture.detectChanges();
    expect(button.classList).not.toContain('a-scrim--dimmed');
  });
});
