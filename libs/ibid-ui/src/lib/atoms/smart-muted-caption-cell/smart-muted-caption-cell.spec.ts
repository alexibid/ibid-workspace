import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartMutedCaptionCellComponent } from './smart-muted-caption-cell';

describe('SmartMutedCaptionCellComponent', () => {
  let fixture: ComponentFixture<SmartMutedCaptionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SmartMutedCaptionCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(SmartMutedCaptionCellComponent);
  });

  it('renders the given value', () => {
    fixture.componentRef.setInput('value', 'principal');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('principal');
  });

  it('renders an em dash for an undefined value', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('—');
  });

  it('renders an em dash for a blank value', () => {
    fixture.componentRef.setInput('value', '   ');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('—');
  });
});
