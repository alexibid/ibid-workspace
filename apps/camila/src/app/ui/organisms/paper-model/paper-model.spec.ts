import { TestBed } from '@angular/core/testing';
import { I18N_CONFIG_TOKEN } from '@ibid/services';
import { BOX_DINO } from '@domain/data/paper-models';
import { CAMILA_I18N_CONFIG } from '../../../i18n.config';
import { PaperModelComponent } from './paper-model';

const MODEL_LABEL = 'a paper model';

describe('PaperModelComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [PaperModelComponent],
      providers: [{ provide: I18N_CONFIG_TOKEN, useValue: CAMILA_I18N_CONFIG }],
    })
  );

  function render() {
    const fixture = TestBed.createComponent(PaperModelComponent);
    fixture.componentRef.setInput('model', BOX_DINO);
    fixture.componentRef.setInput('ariaLabel', MODEL_LABEL);
    fixture.detectChanges();
    return fixture;
  }

  it('builds six faces for every box in the model', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelectorAll('.o-paper-model__box')).toHaveLength(BOX_DINO.boxes.length);
    expect(element.querySelectorAll('.o-paper-model__face')).toHaveLength(
      BOX_DINO.boxes.length * 6
    );
  });

  it('stands a crest spike for every one the model declares', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelectorAll('.o-paper-model__spike')).toHaveLength(
      BOX_DINO.spikes.length
    );
  });

  it('prints the face and the grin only on the boxes that carry them', () => {
    const element = render().nativeElement as HTMLElement;

    expect(element.querySelectorAll('.o-paper-model__eye')).toHaveLength(2);
    expect(element.querySelectorAll('.o-paper-model__teeth')).toHaveLength(1);
  });

  it('names the model for assistive technology', () => {
    const element = render().nativeElement as HTMLElement;

    const stage = element.querySelector('.o-paper-model__stage') as HTMLElement;
    expect(stage.getAttribute('role')).toBe('img');
    expect(stage.getAttribute('aria-label')).toBe(MODEL_LABEL);
  });

  it('turns the model and returns to the opening pose', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    const scene = () => element.querySelector('.o-paper-model__scene') as HTMLElement;
    const opening = scene().style.transform;

    element.querySelectorAll<HTMLButtonElement>('.o-paper-model__key')[2].click();
    fixture.detectChanges();
    expect(scene().style.transform).not.toBe(opening);

    element.querySelectorAll<HTMLButtonElement>('.o-paper-model__key')[1].click();
    fixture.detectChanges();
    expect(scene().style.transform).toBe(opening);
  });
});
