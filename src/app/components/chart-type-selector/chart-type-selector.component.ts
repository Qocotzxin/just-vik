import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { TypeSelectorOptions } from 'src/app/model/chart';

@Component({
  selector: 'app-chart-type-selector',
  templateUrl: 'chart-type-selector.component.html',
  styles: [
    `
      button {
        margin: 1em;
      }
    `,
  ],
})
export class ChartTypeSelectorComponent implements OnInit, AfterViewInit {

  /**
   * Configurations to show buttons.
   */
  @Input() options: TypeSelectorOptions[] = [];

  /**
   * Emitter to send current type to parent components.
   */
  @Input() selectedType$!: Subject<string>;

  /**
   * Current selected type.
   */
  currentType = '';

  ngOnInit() {
    this.currentType = this.options[0].type;
  }

  ngAfterViewInit() {
    this.selectedType$.next(this.currentType);
  }

  /**
   * Sets the current type when button is clicked.
   * @param type: string
   * @method
   */
  setType(type: string) {
    this.currentType = type;
    this.selectedType$.next(type);
  }

  trackBy(index: number, option: TypeSelectorOptions): string {
    return option.type;
  }
}
