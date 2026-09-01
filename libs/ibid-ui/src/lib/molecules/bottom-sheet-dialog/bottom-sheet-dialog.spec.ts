import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BottomSheetDialogComponent } from './bottom-sheet-dialog';

describe('BottomSheetDialogComponent', () => {
  let component: BottomSheetDialogComponent;
  let fixture: ComponentFixture<BottomSheetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeClicked when the close button is clicked', () => {
    const emitted = vi.fn();
    component.closeClicked.subscribe(emitted);

    const closeBtn = fixture.debugElement.query(By.css('.m-bottom-sheet-dialog__close-btn button'));
    closeBtn.nativeElement.click();

    expect(emitted).toHaveBeenCalled();
  });
});
