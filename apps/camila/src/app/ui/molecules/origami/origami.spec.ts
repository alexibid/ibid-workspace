import { TestBed } from '@angular/core/testing';
import { ORIGAMI_STAGES, origamiFor } from '@domain/data/origami-figures';
import { OrigamiComponent } from './origami';

describe('OrigamiComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [OrigamiComponent] }));

  function render(stage: number) {
    const fixture = TestBed.createComponent(OrigamiComponent);
    fixture.componentRef.setInput('domain', 'tarefas');
    fixture.componentRef.setInput('stage', stage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows nothing folded and the whole shape as a ghost at stage zero', () => {
    const element = render(0);

    expect(element.querySelectorAll('.m-origami__facet')).toHaveLength(0);
    expect(element.querySelectorAll('.m-origami__ghost')).toHaveLength(
      origamiFor('tarefas').facets.length
    );
  });

  it('unfolds one facet per stage', () => {
    expect(render(1).querySelectorAll('.m-origami__facet')).toHaveLength(1);
    expect(render(3).querySelectorAll('.m-origami__facet')).toHaveLength(3);
  });

  it('leaves no ghost showing once the figure is complete', () => {
    const element = render(ORIGAMI_STAGES);

    expect(element.querySelectorAll('.m-origami__ghost')).toHaveLength(0);
    expect(element.querySelector('.m-origami--complete')).not.toBeNull();
  });

  it('carries a text equivalent', () => {
    const fixture = TestBed.createComponent(OrigamiComponent);
    fixture.componentRef.setInput('domain', 'familia');
    fixture.componentRef.setInput('ariaLabel', 'a folded figure');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toBe(
      'a folded figure'
    );
  });
});
