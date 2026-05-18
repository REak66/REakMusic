import {
    Component,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy
} from '@angular/core';
import { PaginatorState } from 'primeng/paginator';

@Component({
    standalone: false,
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent implements OnChanges {
    /** Total number of items */
    @Input() total = 0;
    /** Number of items per page */
    @Input() pageSize = 10;
    /** Current active page (1-based) */
    @Input() currentPage = 1;

    /** Emits the new page number (1-based) when the user changes page */
    @Output() pageChange = new EventEmitter<number>();
    /** Emits the new page size when the user changes items-per-page */
    @Output() pageSizeChange = new EventEmitter<number>();

    /** PrimeNG p-paginator uses 0-based `first` (byte offset) */
    first = 0;

    readonly rowsPerPageOptions = [10, 20, 50, 100];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentPage'] || changes['pageSize']) {
            this.first = (this.currentPage - 1) * this.pageSize;
        }
    }

    onPageChange(event: PaginatorState): void {
        const newRows = event.rows ?? this.pageSize;
        const newFirst = event.first ?? 0;

        if (newRows !== this.pageSize) {
            this.pageSizeChange.emit(newRows);
        }

        const newPage = Math.floor(newFirst / newRows) + 1;
        if (newPage !== this.currentPage) {
            this.pageChange.emit(newPage);
        }
    }
}
