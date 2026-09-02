import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HandDrawnDirective, HandDrawnIntensity } from './hand-drawn.directive';
import { MOCK_BAND_SAMPLES, MOCK_CORNER_BANDS } from './hand-drawn.mock';

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

@Component({
  standalone: true,
  imports: [HandDrawnDirective],
  template: `
    @for (intensity of samples; track $index) {
      <div class="band-sample" [attr.data-intensity]="intensity" [ibidHandDrawn]="intensity"></div>
    }
  `
})
class BandHostComponent {
  readonly samples = MOCK_BAND_SAMPLES;
}

const cornerRadiiOf = (element: HTMLElement): readonly number[] =>
  [...element.style.clipPath.matchAll(/(\d+)px/g)].map(match => Number(match[1]));

describe('HandDrawnDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('adds o-hand-drawn class to elements', () => {
    const el = fixture.nativeElement.querySelector('.test-default');
    expect(el.classList.contains('o-hand-drawn')).toBe(true);
  });

  it('applies border-radius style on default intensity', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-default');
    expect(el.style.borderRadius).toContain('%');
  });

  it('applies subtle border-radius variation on level 1', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-level-1');
    expect(el.style.borderRadius).toContain('%');
  });

  it('applies bold border-radius variation on level 5', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-level-5');
    expect(el.style.borderRadius).toContain('%');
  });

  it('applies clip-path inset with corner rounding', () => {
    const el: HTMLElement = fixture.nativeElement.querySelector('.test-default');
    expect(el.style.clipPath).toContain('inset');
  });

  it('flattens bottom, left, right edges when edges: ["top"] is used', () => {
    const sheetEl: HTMLElement = fixture.nativeElement.querySelector('.test-sheet');
    expect(sheetEl.style.borderRadius).toContain('0 0');
  });

  it('flattens top, left, right edges when edges: ["bottom"] is used', () => {
    const headerEl: HTMLElement = fixture.nativeElement.querySelector('.test-header');
    expect(headerEl.style.borderRadius.startsWith('0 0')).toBe(true);
  });

  it('supports programmatic setConfiguration', () => {
    const component = fixture.componentInstance;
    component.progDir?.setConfiguration({ intensity: 4, edges: ['top'] });
    const progEl: HTMLElement = fixture.nativeElement.querySelector('.test-programmatic');
    expect(progEl.style.borderRadius).toContain('0 0');
  });

  describe('intensity bands', () => {
    let bandFixture: ComponentFixture<BandHostComponent>;

    const samplesAt = (intensity: HandDrawnIntensity): readonly HTMLElement[] =>
      [...bandFixture.nativeElement.querySelectorAll(`[data-intensity="${intensity}"]`)];

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({ imports: [BandHostComponent] }).compileComponents();
      bandFixture = TestBed.createComponent(BandHostComponent);
      bandFixture.detectChanges();
    });

    it('keeps every corner inside the band its intensity declares', () => {
      const outOfBand = MOCK_BAND_SAMPLES.flatMap(intensity => {
        const [min, max] = MOCK_CORNER_BANDS[intensity];
        return samplesAt(intensity)
          .flatMap(cornerRadiiOf)
          .filter(radius => radius < min || radius > max)
          .map(radius => `intensity ${intensity}: ${radius}px outside ${min}-${max}`);
      });

      expect(outOfBand).toEqual([]);
    });

    it('draws four corners for every element', () => {
      const wrongCount = samplesAt(2).filter(element => cornerRadiiOf(element).length !== 4);

      expect(wrongCount).toEqual([]);
    });

    it('varies the shape between elements that share an intensity', () => {
      const shapes = samplesAt(3).map(element => element.style.clipPath);

      expect(new Set(shapes).size).toBeGreaterThan(1);
    });

    it('keeps the bands apart so the intensities stay distinguishable', () => {
      const ordered = ([1, 2, 3, 4, 5] as readonly HandDrawnIntensity[]).map(
        intensity => MOCK_CORNER_BANDS[intensity]
      );
      const overlaps = ordered
        .slice(1)
        .filter((band, index) => band[0] <= ordered[index][1]);

      expect(overlaps).toEqual([]);
    });
  });
});
