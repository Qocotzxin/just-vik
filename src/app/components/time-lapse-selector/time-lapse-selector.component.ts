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
   * Variants of timeframes to apply in chart view.
   */
  lapses = [Lapse.week, Lapse.month, Lapse.year];

  /**
   * Selected timeframe.
   */
  @Input() currentValue$!: Subject<Lapse>;

  /**
   * Setter Used to emit on chart changes (can use any string to reset).
   * @param val: string | null
   */
  @Input() set reset(val: string | null) {
    this._reset = val;
    this.currentValue$.next(this.value);
  }

  /**
   * Getter for reset input.
   * @return string | null
   */
  get reset() {
    return this._reset;
  }

  /**
   * Double binding for select control.
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
