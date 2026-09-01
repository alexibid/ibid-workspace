import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottomSheetFooterComponent } from './bottom-sheet-footer.component';

describe('BottomSheetFooterComponent', () => {
  let component: BottomSheetFooterComponent;
  let fixture: ComponentFixture<BottomSheetFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetFooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
