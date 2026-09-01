import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DismissButtonComponent } from './dismiss-button';

describe('DismissButtonComponent', () => {
  let component: DismissButtonComponent;
  let fixture: ComponentFixture<DismissButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DismissButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DismissButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and emit dismissed on click without bubbling', () => {
    expect(component).toBeTruthy();
    const spy = vi.spyOn(component.dismissed, 'emit');
    const mouseEvent = new MouseEvent('click');
    const stopSpy = vi.spyOn(mouseEvent, 'stopPropagation');

    const button = fixture.nativeElement.querySelector('button');
    button.dispatchEvent(mouseEvent);

    expect(spy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });
});
