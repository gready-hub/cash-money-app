import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
  selector: 'cash-money-home',

  imports: [AnalogWelcomeComponent],
  template: ` <cash-money-analog-welcome /> `,
})
export default class HomeComponent {}
