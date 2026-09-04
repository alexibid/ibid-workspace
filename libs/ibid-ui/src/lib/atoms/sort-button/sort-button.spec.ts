import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SortButtonComponent } from './sort-button';

describe('SortButtonComponent', () => {
  let component: SortButtonComponent;
  let fixture: ComponentFixture<SortButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SortButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked when clicked', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.onClick();
    expect(spy).toHaveBeenCalled();
  });
});
