import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent {
    /** Progress value 0–100 (ignored in indeterminate mode) */
    @Input() value = 0;
    /** Optional label displayed above the bar */
    @Input() label = '';
    /** 'determinate' shows a filled bar; 'indeterminate' shows an animated scanning bar */
    @Input() mode: 'determinate' | 'indeterminate' = 'determinate';
    /** Color theme: primary | success | warning | danger | info */
    @Input() color: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';
    /** Show numeric percentage next to the label (determinate mode only) */
    @Input() showPercentage = true;
}
