import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartBudgetCellComponent } from './smart-budget-cell';
import { I18nService } from '@ibid/services';

describe('SmartBudgetCellComponent', () => {
  let fixture: ComponentFixture<SmartBudgetCellComponent>;

  const mockI18nService = {
    translate: (_key: string, fallback?: string) => fallback ?? ''
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartBudgetCellComponent],
      providers: [{ provide: I18nService, useValue: mockI18nService }]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartBudgetCellComponent);
  });

  it('shows the category name it was given', () => {
    fixture.componentRef.setInput('categoryId', 'Groceries');
    fixture.componentRef.setInput('categoryName', 'Groceries');
    fixture.componentRef.setInput('categoryColor', '#10b981');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('Groceries');
  });

  it('sets --category-color to the real category color, not a bucketed family', () => {
    fixture.componentRef.setInput('categoryId', 'Groceries');
    fixture.componentRef.setInput('categoryName', 'Groceries');
    fixture.componentRef.setInput('categoryColor', '#10b981');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell');
    expect(el.style.getPropertyValue('--category-color')).toBe('#10b981');
    expect(el.classList.contains('a-smart-budget-cell--uncategorized')).toBe(false);
  });

  it('falls back to the uncategorized label and neutral style when there is no category', () => {
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell');
    expect(el.classList.contains('a-smart-budget-cell--uncategorized')).toBe(true);
    expect(fixture.nativeElement.textContent.trim()).toBe('Sem categoria');
  });

  it('picks a WCAG-accessible text color instead of a fixed white', () => {
    fixture.componentRef.setInput('categoryId', 'Others');
    fixture.componentRef.setInput('categoryName', 'Others');
    fixture.componentRef.setInput('categoryColor', '#cbd5e1');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell');
    expect(el.style.color).toBe('rgb(0, 0, 0)');
  });

  it('hides the chevron by default and shows it when showChevron is set', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.a-smart-budget-cell__chevron')).toBeFalsy();

    fixture.componentRef.setInput('showChevron', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.a-smart-budget-cell__chevron')).toBeTruthy();
  });

  it('shows the project name instead of the category when a project is assigned', () => {
    fixture.componentRef.setInput('categoryId', 'Groceries');
    fixture.componentRef.setInput('categoryName', 'Groceries');
    fixture.componentRef.setInput('categoryColor', '#10b981');
    fixture.componentRef.setInput('projectName', 'Férias Algarve 2026');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toContain('Férias Algarve 2026');
    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell');
    expect(el.classList.contains('a-smart-budget-cell--project')).toBe(true);
    expect(el.classList.contains('a-smart-budget-cell--uncategorized')).toBe(false);
  });

  it('ignores the category color once a project is assigned, so the project style wins', () => {
    fixture.componentRef.setInput('categoryId', 'Groceries');
    fixture.componentRef.setInput('categoryName', 'Groceries');
    fixture.componentRef.setInput('categoryColor', '#10b981');
    fixture.componentRef.setInput('projectName', 'Férias Algarve 2026');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell');
    expect(el.style.getPropertyValue('--category-color')).toBe('');
  });

  it('keeps the category visible alongside the project, so the user can see what they are about to change', () => {
    fixture.componentRef.setInput('categoryId', 'Groceries');
    fixture.componentRef.setInput('categoryName', 'Groceries');
    fixture.componentRef.setInput('projectName', 'Férias Algarve 2026');
    fixture.detectChanges();

    const category: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell__category');
    expect(category).not.toBeNull();
    expect(category.textContent?.trim()).toBe('Groceries');
  });

  it('does not repeat the category as a secondary label when no project owns the movement', () => {
    fixture.componentRef.setInput('categoryId', 'Groceries');
    fixture.componentRef.setInput('categoryName', 'Groceries');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.a-smart-budget-cell__category')).toBeNull();
  });

  it('shows the uncategorized label next to the project when the movement has no category', () => {
    fixture.componentRef.setInput('projectName', 'Férias Algarve 2026');
    fixture.detectChanges();

    const category: HTMLElement = fixture.nativeElement.querySelector('.a-smart-budget-cell__category');
    expect(category.textContent?.trim()).toBe('Sem categoria');
  });
});
