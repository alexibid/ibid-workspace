import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HandDrawnDirective,
  generatePebbleNormalizedPath
} from './hand-drawn.directive';

@Component({
  standalone: true,
  imports: [HandDrawnDirective],
  template: `
    <div ibidHandDrawn class="test-default"></div>
    <div [ibidHandDrawn]="1" class="test-level-1"></div>
    <div [ibidHandDrawn]="5" class="test-level-5"></div>
    <div [ibidHandDrawn]="{ intensity: 3, edges: ['top'] }" class="test-sheet"></div>
    <div [ibidHandDrawn]="{ intensity: 1, edges: ['bottom'] }" class="test-header"></div>
    <div #testProg="ibidHandDrawn" [ibidHandDrawn]="{ intensity: 2 }" class="test-programmatic"></div>
  `
})
class TestHostComponent {
  @ViewChild('testProg', { read: HandDrawnDirective }) progDir?: HandDrawnDirective;
}

describe('HandDrawnDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('applies svg clip-path url to elements', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-default');
    expect(el.style.clipPath).toContain('url(#ibid-pebble-');
  });

  it('applies contour custom properties on default intensity', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-default');
    expect(el.style.getPropertyValue('--ibid-contour-clip')).toContain('url(#ibid-pebble-');
    expect(el.style.getPropertyValue('--ibid-contour-corners')).toContain('url(#ibid-pebble-');
    expect(el.style.getPropertyValue('--hand-drawn-intensity')).toBe('2');
  });

  it('applies level 1 intensity custom property', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-level-1');
    expect(el.style.getPropertyValue('--hand-drawn-intensity')).toBe('1');
  });

  it('applies level 5 intensity custom property', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-level-5');
    expect(el.style.getPropertyValue('--hand-drawn-intensity')).toBe('5');
  });

  it('generates normalized svg path with valid coordinates', () => {
    const path = generatePebbleNormalizedPath(2);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(path).toContain('Q ');
    expect(path).toContain('C ');
  });

  it('flattens corners when partial edges are specified', () => {
    const sheetPath = generatePebbleNormalizedPath(3, ['top']);
    expect(sheetPath.startsWith('M ')).toBe(true);
    expect(sheetPath.endsWith('Z')).toBe(true);
  });

  it('supports programmatic setConfiguration', () => {
    const component = fixture.componentInstance;
    component.progDir?.setConfiguration({ intensity: 4, edges: ['top'] });
    const progEl: HTMLElement = fixture.nativeElement.querySelector('.test-programmatic');
    expect(progEl.style.getPropertyValue('--hand-drawn-intensity')).toBe('4');
  });

  it('cleans up clipPath element on destroy', () => {
    const initialClips = document.querySelectorAll('#ibid-pebble-svg-defs clipPath').length;
    expect(initialClips).toBeGreaterThan(0);

    fixture.destroy();

    const remainingClips = document.querySelectorAll('#ibid-pebble-svg-defs clipPath').length;
    expect(remainingClips).toBeLessThan(initialClips);
  });
});

