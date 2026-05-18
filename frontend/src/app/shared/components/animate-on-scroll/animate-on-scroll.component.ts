import {
    Component,
    Input,
    ChangeDetectionStrategy
} from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-animate-on-scroll',
    templateUrl: './animate-on-scroll.component.html',
    styleUrls: ['./animate-on-scroll.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateOnScrollComponent {
    /** CSS class(es) applied when the element enters the viewport */
    @Input() enterClass = '';

    /** CSS class(es) applied when the element leaves the viewport */
    @Input() leaveClass = '';

    /** Intersection ratio threshold (0–1) that triggers the animation */
    @Input() threshold = 0.2;

    /** When true, animation fires only once (element stays animated after leaving viewport) */
    @Input() once = true;

    /** Inline styles applied to the host container */
    @Input() style: { [key: string]: string } | null = null;

    /** Extra CSS class applied to the host container */
    @Input() styleClass = '';
}
