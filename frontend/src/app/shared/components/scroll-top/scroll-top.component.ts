import { Component, Input } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-scroll-top',
    templateUrl: './scroll-top.component.html',
    styleUrls: ['./scroll-top.component.scss']
})
export class ScrollTopComponent {
    /** Scroll distance in pixels before the button becomes visible */
    @Input() threshold = 300;

    /** Scroll behavior: 'smooth' or 'auto' */
    @Input() behavior: 'smooth' | 'auto' = 'smooth';
}
