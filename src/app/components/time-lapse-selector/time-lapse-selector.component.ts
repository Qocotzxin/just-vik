import { AfterViewInit, Component, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Subject } from 'rxjs';
import { Lapse } from 'src/app/model/chart';

@Component({
  selector: 'app-time-lapse-selector',
  templateUrl: 'time-lapse-selector.component.html',
})
export class LapseSelectorComponent implements AfterViewInit {
  private _reset: string | null = null;

  /**
   * Variants of time frames to apply in chart view.
   */
  lapses = [Lapse.week, Lapse.month, Lapse.year];

  /**
   * Selected time frame.
   */
  @Input() currentValue$!: Subject<Lapse>;

  /**
   * Used to emit on chart changes (can use any string to reset).
   */
  @Input() set reset(val: string | null) {
    this._reset = val;
    this.currentValue$.next(this.value);
  }

  get reset() {
    return this._reset;
  }

  /**
   * Double binding for select.
   */
  value = Lapse.week;

  ngAfterViewInit() {
    this.currentValue$.next(this.value);
  }

  /**
   * Emits the selected value to parent.
   * @param e: MatSelectChange
   */
  onSelectionChange(e: MatSelectChange) {
    this.currentValue$.next(e.value);
  }
}
