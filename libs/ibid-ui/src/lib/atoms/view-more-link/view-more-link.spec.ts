import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { ViewMoreLinkComponent } from './view-more-link';
import { TEST_I18N_CONFIG } from '../../../testing/i18n.mock';

describe('ViewMoreLinkComponent', () => {
  let component: ViewMoreLinkComponent;
  let fixture: ComponentFixture<ViewMoreLinkComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMoreLinkComponent],
      providers: [provideRouter([]), { provide: I18N_CONFIG_TOKEN, useValue: TEST_I18N_CONFIG }]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMoreLinkComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should navigate to /movements filtered by accountId when one is given', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.accountId = 'acc-123';
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(navigateSpy).toHaveBeenCalledWith(['/movements'], { queryParams: { accountId: 'acc-123' } });
  });

  it('should navigate to /movements without a filter when no accountId is given (the general card)', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();

    expect(navigateSpy).toHaveBeenCalledWith(['/movements'], { queryParams: {} });
  });

  it('should stop the click from bubbling up to any clickable ancestor', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');
    button.dispatchEvent(event);

    expect(stopSpy).toHaveBeenCalled();
  });
});
