import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LegendItemComponent } from './legend-item';

describe('LegendItemComponent', () => {
  let fixture: ComponentFixture<LegendItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegendItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LegendItemComponent);
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('color', '#5DCAA5');
    fixture.detectChanges();
  });

  it('renders label and applies mark background color', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent?.trim()).toContain('Test Label');
    const mark = el.querySelector('.a-legend-item__mark') as HTMLElement;
    expect(mark).toBeTruthy();
  });
});
