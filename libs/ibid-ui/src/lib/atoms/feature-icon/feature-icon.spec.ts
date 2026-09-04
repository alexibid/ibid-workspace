import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureIconComponent } from './feature-icon';

describe('FeatureIconComponent', () => {
  let component: FeatureIconComponent;
  let fixture: ComponentFixture<FeatureIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureIconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureIconComponent);
    fixture.componentRef.setInput('name', 'shopping_bag');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render icon', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement.querySelector('.a-feature-icon');
    expect(el).toBeTruthy();
    expect(el.classList.contains('a-feature-icon--md')).toBe(true);
  });

  it('should apply size classes correctly', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.a-feature-icon');
    expect(el.classList.contains('a-feature-icon--lg')).toBe(true);
  });

  it('should set custom color variable', () => {
    fixture.componentRef.setInput('color', '#a855f7');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.a-feature-icon') as HTMLElement;
    expect(el.style.getPropertyValue('--feature-icon-color')).toBe('#a855f7');
  });

  it('should set aria attributes when provided', () => {
    fixture.componentRef.setInput('ariaLabel', 'Category icon');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.a-feature-icon');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Category icon');
  });
});
