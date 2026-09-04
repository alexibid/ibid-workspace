import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureDisplayComponent } from './feature-display';
import { I18nService } from '@ibid/services';
import { createMockI18nService } from '../../../testing/i18n.mock';

@Component({
  standalone: true,
  imports: [FeatureDisplayComponent],
  template: `<ibid-currency-display [value]="1284.5" [showInfo]="false" />`
})
class DeprecatedSelectorHostComponent {}

describe('FeatureDisplayComponent', () => {
  let fixture: ComponentFixture<FeatureDisplayComponent>;

  const element = (): HTMLElement => fixture.nativeElement.querySelector('.a-feature-display');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureDisplayComponent],
      providers: [{ provide: I18nService, useValue: createMockI18nService() }]
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureDisplayComponent);
  });

  it('formats the value through the i18n service', () => {
    fixture.componentRef.setInput('value', 12480);
    fixture.detectChanges();

    expect(element().textContent?.trim()).toBe('12480.00 €');
  });

  it('shows an em dash for an undefined value instead of formatting it', () => {
    fixture.componentRef.setInput('value', undefined);
    fixture.detectChanges();

    expect(element().textContent?.trim()).toBe('—');
  });

  it('applies the requested size as a modifier', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('size', 'xl');
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--xl')).toBe(true);
  });

  it('leaves the value unstyled by sign unless sign colouring is asked for', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--negative')).toBe(false);
  });

  it('prefixes a plus on positive values when an explicit sign is asked for', () => {
    fixture.componentRef.setInput('value', 84.2);
    fixture.componentRef.setInput('showPositiveSign', true);
    fixture.detectChanges();

    expect(element().textContent?.trim()).toBe('+84.20 €');
  });

  it('never prefixes a plus on zero or negative values', () => {
    fixture.componentRef.setInput('value', 0);
    fixture.componentRef.setInput('showPositiveSign', true);
    fixture.detectChanges();
    expect(element().textContent?.trim()).toBe('0.00 €');

    fixture.componentRef.setInput('value', -5);
    fixture.detectChanges();
    expect(element().textContent?.trim()).toBe('-5.00 €');
  });

  it('formats the magnitude when the sign is carried elsewhere', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.componentRef.setInput('absolute', true);
    fixture.detectChanges();

    expect(element().textContent?.trim()).toBe('84.20 €');
  });

  it('treats zero as neither positive nor negative', () => {
    fixture.componentRef.setInput('value', 0);
    fixture.componentRef.setInput('signed', true);
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--positive')).toBe(false);
    expect(element().classList.contains('a-feature-display--negative')).toBe(false);
  });

  it('does not offer explanation affordance by default', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-feature-display__info')).toBeNull();
  });

  it('offers the explanation affordance when showInfo is enabled', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('showInfo', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-feature-display__info')).not.toBeNull();
  });

  it('falls back to showing the figure itself when no rows are supplied', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('showInfo', true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.a-feature-display__info').click();
    fixture.detectChanges();

    expect(fixture.componentInstance['balloonRows']().length).toBe(1);
    expect(fixture.componentInstance['balloonRows']()[0].value).toBe('10.00 €');
  });

  it('renders an info trigger when an explanation is provided and showInfo is true', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('showInfo', true);
    fixture.componentRef.setInput('explanation', [{ label: 'Receitas', value: '+30,00 €' }]);
    fixture.detectChanges();

    const hitArea: HTMLElement = fixture.nativeElement.querySelector('.a-feature-display-hit-area');
    expect(hitArea).not.toBeNull();
    expect(hitArea.getAttribute('role')).toBe('button');
    expect(hitArea.getAttribute('aria-label')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.a-feature-display__info')).not.toBeNull();
  });

  it('toggles the explanation balloon open and closed', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('showInfo', true);
    fixture.componentRef.setInput('explanation', [{ label: 'Receitas', value: '+30,00 €' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance['isOpen']()).toBe(false);

    fixture.nativeElement.querySelector('.a-feature-display__info').click();
    expect(fixture.componentInstance['isOpen']()).toBe(true);

    fixture.nativeElement.querySelector('.a-feature-display__info').click();
    expect(fixture.componentInstance['isOpen']()).toBe(false);
  });

  it('colours by sign when signed is enabled', () => {
    fixture.componentRef.setInput('value', -84.2);
    fixture.componentRef.setInput('signed', true);
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--negative')).toBe(true);

    fixture.componentRef.setInput('value', 84.2);
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--positive')).toBe(true);
  });

  it('applies status modifier classes when explicit status is provided', () => {
    fixture.componentRef.setInput('value', 100);
    fixture.componentRef.setInput('status', 'warning');
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--warning')).toBe(true);
    expect(element().classList.contains('a-feature-display--positive')).toBe(false);

    fixture.componentRef.setInput('status', 'negative');
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--negative')).toBe(true);
    expect(element().classList.contains('a-feature-display--warning')).toBe(false);

    fixture.componentRef.setInput('status', 'positive');
    fixture.detectChanges();

    expect(element().classList.contains('a-feature-display--positive')).toBe(true);
  });

  describe('deprecated selector', () => {
    let host: ComponentFixture<DeprecatedSelectorHostComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [DeprecatedSelectorHostComponent],
        providers: [{ provide: I18nService, useValue: createMockI18nService() }]
      }).compileComponents();

      host = TestBed.createComponent(DeprecatedSelectorHostComponent);
      host.detectChanges();
    });

    it('still answers to ibid-currency-display so products can migrate on their own schedule', () => {
      const value: HTMLElement = host.nativeElement.querySelector('.a-feature-display');

      expect(value).not.toBeNull();
      expect(value.textContent?.trim()).toBe('1284.50 €');
    });
  });
});
