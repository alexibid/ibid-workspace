import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchableSelectComponent } from './searchable-select';

describe('SearchableSelectComponent', () => {
  let component: SearchableSelectComponent;
  let fixture: ComponentFixture<SearchableSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchableSelectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchableSelectComponent) as ComponentFixture<SearchableSelectComponent<string>>;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter options by search query', () => {
    component.options = [
      { value: 'cat1', label: 'Alimentação' },
      { value: 'cat2', label: 'Transporte' },
      { value: 'cat3', label: 'Lazer' }
    ];
    fixture.detectChanges();

    expect(component['filteredOptions']().length).toBe(3);

    component['searchQuery'].set('trans');
    fixture.detectChanges();

    expect(component['filteredOptions']().length).toBe(1);
    expect(component['filteredOptions']()[0].value).toBe('cat2');
  });

  it('should emit valueChange on option selection', () => {
    const spy = vi.fn();
    component.valueChange.subscribe(spy);

    component['selectOption']('cat1');

    expect(spy).toHaveBeenCalledWith('cat1');
    expect(component.value).toBe('cat1');
  });
});
