import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BottomSheetHeaderComponent } from './bottom-sheet-header.component';

describe('BottomSheetHeaderComponent', () => {
  let component: BottomSheetHeaderComponent;
  let fixture: ComponentFixture<BottomSheetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeClicked when close button is clicked', () => {
    const emitted = vi.fn();
    component.closeClicked.subscribe(emitted);

    const closeBtn = fixture.debugElement.query(By.css('.a-bottom-sheet-header__close-btn'));
    closeBtn.nativeElement.click();

    expect(emitted).toHaveBeenCalled();
  });
});
