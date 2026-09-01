import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartIconCellComponent } from './smart-icon-cell';

describe('SmartIconCellComponent', () => {
  let fixture: ComponentFixture<SmartIconCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SmartIconCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(SmartIconCellComponent);
  });

  it('renders the category icon by default', () => {
    fixture.componentRef.setInput('iconName', 'home');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ibid-icon')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.a-smart-icon-cell__checkbox')).toBeFalsy();
  });

  it('renders a checkbox instead of the icon in checkbox mode', () => {
    fixture.componentRef.setInput('mode', 'checkbox');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-smart-icon-cell__checkbox')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('mat-icon')).toBeFalsy();
  });

  it('emits checkedChange with the toggled value when the checkbox changes', () => {
    fixture.componentRef.setInput('mode', 'checkbox');
    fixture.componentRef.setInput('checked', false);
    fixture.detectChanges();

    const emitted: boolean[] = [];
    fixture.componentInstance.checkedChange.subscribe((v: boolean) => emitted.push(v));

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('.a-smart-icon-cell__checkbox');
    checkbox.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([true]);
  });

});
