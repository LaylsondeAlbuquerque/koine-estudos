import {ChangeDetectionStrategy,Component,input} from '@angular/core';
@Component({selector:'koine-progress,koine-progress-bar',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,
 host:{style:'display:contents'},template:`<div class="progress-track" role="progressbar" aria-label="Progresso" aria-valuemin="0" [attr.aria-valuemax]="max()" [attr.aria-valuenow]="value()"><div class="progress-fill" [style.width.%]="max()?Math.min(value()/max()*100,100):0"></div></div>`})
export class ProgressBarComponent {readonly value=input(0);readonly max=input(1);protected readonly Math=Math;}
