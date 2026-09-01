import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input';

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchInputComponent);
  });

  it('renders the given value and placeholder', () => {
    fixture.componentRef.setInput('value', 'continente');
    fixture.componentRef.setInput('placeholder', 'Pesquisar...');
    fixture.detectChanges();

    const field: HTMLInputElement = fixture.nativeElement.querySelector('.a-search-input__field');
    expect(field.value).toBe('continente');
    expect(field.placeholder).toBe('Pesquisar...');
  });

  it('emits valueChange as the user types', () => {
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v: string) => emitted.push(v));

    const field: HTMLInputElement = fixture.nativeElement.querySelector('.a-search-input__field');
    field.value = 'mercearia';
    field.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['mercearia']);
  });

  it('shows the search icon and hides the clear button when there is no value and not focused', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.a-search-input__icon')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.a-search-input__clear')).toBeFalsy();
  });

  it('shows the clear button and hides the search icon when focused', () => {
    fixture.detectChanges();

    const field: HTMLInputElement = fixture.nativeElement.querySelector('.a-search-input__field');
    field.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-search-input__clear')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.a-search-input__icon')).toBeFalsy();

    field.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-search-input__clear')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.a-search-input__icon')).toBeTruthy();
  });

  it('shows the clear button with a value and emits an empty string when clicked', () => {
    fixture.componentRef.setInput('value', 'continente');
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v: string) => emitted.push(v));

    expect(fixture.nativeElement.querySelector('.a-search-input__icon')).toBeFalsy();
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.a-search-input__clear');
    expect(clearBtn).toBeTruthy();
    clearBtn.click();

    expect(emitted).toEqual(['']);
  });
});
