import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { ChartTooltipComponent } from './chart-tooltip';

@Component({
  standalone: true,
  imports: [OverlayModule, ChartTooltipComponent],
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin"></div>
    <app-chart-tooltip
      [origin]="origin"
      [isOpen]="isOpen"
      [title]="title"
      [label]="label"
      [value]="value"
      [context]="context"
      (closed)="closedCount = closedCount + 1"
    />
  `
})
class HostComponent {
  isOpen = false;
  title = '';
  label = '';
  value = '';
  context: string | undefined = undefined;
  closedCount = 0;
}

describe('ChartTooltipComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => el.remove());
  });

  it('does not render the overlay content when closed', () => {
    fixture.detectChanges();

    expect(document.querySelector('.a-chart-tooltip')).toBeNull();
  });

  it('renders the title, label, value and context when open', () => {
    fixture.componentInstance.isOpen = true;
    fixture.componentInstance.title = '23 jul';
    fixture.componentInstance.label = 'saldo';
    fixture.componentInstance.value = '12 900€';
    fixture.componentInstance.context = '+4% esta semana';
    fixture.detectChanges();

    const el = document.querySelector('.a-chart-tooltip') as HTMLElement;
    expect(el.textContent).toContain('23 jul');
    expect(el.textContent).toContain('saldo');
    expect(el.textContent).toContain('12 900€');
    expect(el.textContent).toContain('+4% esta semana');
  });

  it('omits the context row when no context is given', () => {
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();

    expect(document.querySelector('.a-chart-tooltip__context')).toBeNull();
  });

  it('emits closed on an outside click', () => {
    fixture.componentInstance.isOpen = true;
    fixture.detectChanges();

    const backdrop: HTMLElement | null = document.querySelector('.cdk-overlay-backdrop');
    backdrop?.click();

    expect(fixture.componentInstance.closedCount).toBe(1);
  });
});
