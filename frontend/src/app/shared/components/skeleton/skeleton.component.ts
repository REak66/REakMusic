import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type SkeletonType =
    | 'song-cards'
    | 'trending'
    | 'song-detail'
    | 'album-detail'
    | 'artist-detail'
    | 'profile';

@Component({
    standalone: false,
    selector: 'app-skeleton',
    templateUrl: './skeleton.component.html',
    styleUrls: ['./skeleton.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
    /** Layout variant to render */
    @Input() type: SkeletonType = 'song-cards';

    /** Number of card / list items to render (for song-cards and trending) */
    @Input() count = 6;

    get items(): number[] {
        return Array.from({ length: this.count }, (_, i) => i);
    }
}
