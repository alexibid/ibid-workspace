import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccentIconComponent } from './accent-icon';

describe('AccentIconComponent', () => {
  let component: AccentIconComponent;
  let fixture: ComponentFixture<AccentIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccentIconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AccentIconComponent);
    component = fixture.componentInstance;
    component.svgIcon = 'star-line';
    fixture.detectChanges();
  });

  it('should create with default coral accent', () => {
    expect(component).toBeTruthy();
    expect(component.accent).toBe('coral');
  });

  it('should render icon with specified accent', () => {
    fixture.componentRef.setInput('accent', 'teal');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.a-accent-icon');
    expect(el.classList.contains('a-assistant-card-icon--teal')).toBe(true);
  });
});
