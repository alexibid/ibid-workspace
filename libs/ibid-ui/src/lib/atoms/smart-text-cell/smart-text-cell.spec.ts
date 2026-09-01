import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartTextCellComponent } from './smart-text-cell';

describe('SmartTextCellComponent', () => {
  let fixture: ComponentFixture<SmartTextCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SmartTextCellComponent] }).compileComponents();
    fixture = TestBed.createComponent(SmartTextCellComponent);
    fixture.componentRef.setInput('value', 'levantamento multibanco agência');
    fixture.detectChanges();
  });

  function setOverflow(isTruncated: boolean): void {
    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-text-cell');
    Object.defineProperty(el, 'scrollWidth', { value: isTruncated ? 300 : 100, configurable: true });
    Object.defineProperty(el, 'clientWidth', { value: 100, configurable: true });
  }

  it('emits truncatedClick when the text actually overflows its box', () => {
    setOverflow(true);
    const emitted: void[] = [];
    fixture.componentInstance.truncatedClick.subscribe(() => emitted.push(undefined));

    fixture.nativeElement.querySelector('.a-smart-text-cell').click();

    expect(emitted).toHaveLength(1);
  });

  it('does not emit truncatedClick when the text fits', () => {
    setOverflow(false);
    const emitted: void[] = [];
    fixture.componentInstance.truncatedClick.subscribe(() => emitted.push(undefined));

    fixture.nativeElement.querySelector('.a-smart-text-cell').click();

    expect(emitted).toHaveLength(0);
  });
});
