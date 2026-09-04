import { TestBed } from '@angular/core/testing';
import { TextareaComponent } from './textarea';

describe('TextareaComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TextareaComponent] }));

  function render(value = '') {
    const fixture = TestBed.createComponent(TextareaComponent);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the value it is given', () => {
    const fixture = render('Pôs a mesa');

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.value).toBe('Pôs a mesa');
  });

  it('emits what the user types', () => {
    const fixture = render();
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'Lavou os dentes';
    field.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['Lavou os dentes']);
  });

  it('exposes an accessible name', () => {
    const fixture = TestBed.createComponent(TextareaComponent);
    fixture.componentRef.setInput('ariaLabel', 'Diário');
    fixture.detectChanges();

    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.getAttribute('aria-label')).toBe('Diário');
  });
});
