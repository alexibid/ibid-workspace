import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoBalloonComponent } from './info-balloon';
import { I18nService } from '@ibid/services';

describe('InfoBalloonComponent', () => {
  let fixture: ComponentFixture<InfoBalloonComponent>;

  const mockI18nService = {
    translate: (key: string) => key,
    currentLang: () => 'pt' as const,
    getCategoryName: (id: string) => id,
    formatCurrency: (v: number) => `${v} €`
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoBalloonComponent],
      providers: [{ provide: I18nService, useValue: mockI18nService }]
    }).compileComponents();

    fixture = TestBed.createComponent(InfoBalloonComponent);
    fixture.componentRef.setInput('title', 'Movimento recorrente');
    fixture.componentRef.setInput('message', 'Esta despesa repete-se com regularidade.');
    fixture.detectChanges();
  });

  it('starts closed', () => {
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('opens on toggle and closes on a second toggle', () => {
    fixture.componentInstance.toggle();
    expect(fixture.componentInstance['isOpen']()).toBe(true);

    fixture.componentInstance.toggle();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('closes on close()', () => {
    fixture.componentInstance.toggle();
    fixture.componentInstance.close();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('closes on Escape when open', () => {
    fixture.componentInstance.toggle();
    fixture.componentInstance['onEscape']();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('defaults to the info icon when none is provided', () => {
    expect(fixture.componentInstance.iconName()).toBe('info');
  });

  it('uses a custom icon when provided', () => {
    fixture.componentRef.setInput('iconName', 'refresh');
    expect(fixture.componentInstance.iconName()).toBe('refresh');
  });
});
