import { Component, signal } from '@angular/core';
import {
  DateInputComponent,
  FormFieldComponent,
  NumberInputComponent,
  SearchInputComponent,
  SegmentedControlComponent,
  SelectComponent
} from 'ibid-ui';

@Component({
  selector: 'boilerplate-inputs-page',
  standalone: true,
  imports: [
    DateInputComponent,
    FormFieldComponent,
    NumberInputComponent,
    SearchInputComponent,
    SegmentedControlComponent,
    SelectComponent
  ],
  templateUrl: './inputs.page.html'
})
export class InputsPage {
  protected readonly searchTerm = signal('');
  protected readonly quantity = signal(3);
  protected readonly chosenDate = signal('2026-09-01');
  protected readonly chosenOption = signal('monthly');
  protected readonly segment = signal('all');

  protected readonly selectOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  protected readonly segments = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' }
  ];
}
