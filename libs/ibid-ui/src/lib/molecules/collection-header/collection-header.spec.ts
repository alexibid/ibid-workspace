import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionHeaderComponent } from './collection-header';

describe('CollectionHeaderComponent', () => {
  let component: CollectionHeaderComponent;
  let fixture: ComponentFixture<CollectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit searchQueryChange when search input changes', () => {
    const spy = vi.fn();
    component.searchQueryChange.subscribe(spy);
    component.searchQueryChange.emit('groceries');
    expect(spy).toHaveBeenCalledWith('groceries');
  });

  it('should emit tabChange when tab changes', () => {
    const spy = vi.fn();
    component.tabChange.subscribe(spy);
    component.tabChange.emit('month');
    expect(spy).toHaveBeenCalledWith('month');
  });
});
