import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataColumnDirective, DataTableComponent } from './data-table';

interface Row {
  readonly name: string;
  readonly amount: number;
}

@Component({
  standalone: true,
  imports: [DataTableComponent, DataColumnDirective],
  template: `
    <ibid-data-table [rows]="rows()" caption="Movements" emptyMessage="Nothing yet">
      <ng-template ibidDataColumn="Name" let-row>{{ row.name }}</ng-template>
      <ng-template ibidDataColumn="Amount" align="end" let-row>{{ row.amount }}</ng-template>
    </ibid-data-table>
  `
})
class HostComponent {
  readonly rows = signal<readonly Row[]>([
    { name: 'Lidl', amount: -42 },
    { name: 'Salary', amount: 2400 }
  ]);
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders one column heading per declared column', () => {
    const headings = fixture.nativeElement.querySelectorAll('th');
    expect(headings.length).toBe(2);
    expect(headings[0].textContent.trim()).toBe('Name');
    expect(headings[1].textContent.trim()).toBe('Amount');
  });

  it('renders one row per item, projecting each column template', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Lidl');
    expect(rows[1].textContent).toContain('2400');
  });

  it('aligns a column to the end when asked', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr:first-child td');
    expect(cells[1].classList).toContain('m-data-table__cell--end');
  });

  it('shows the empty message when there are no rows', async () => {
    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    const empty = fixture.nativeElement.querySelector('.m-data-table__empty');
    expect(empty?.textContent).toContain('Nothing yet');
  });
});
