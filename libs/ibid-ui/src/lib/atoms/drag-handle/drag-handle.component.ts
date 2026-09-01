import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-drag-handle',
  standalone: true,
  templateUrl: './drag-handle.component.html',
  styleUrls: ['./drag-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragHandleComponent {
  @Output() readonly pointerDown = new EventEmitter<PointerEvent>();

  onPointerDown(event: PointerEvent): void {
    this.pointerDown.emit(event);
  }
}
