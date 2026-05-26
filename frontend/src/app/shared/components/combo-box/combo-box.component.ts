import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiFilterByInputPipe } from '@taiga-ui/core/pipes/filter-by-input';
import { TuiChevron } from '@taiga-ui/kit/directives/chevron';
import { TuiComboBox } from '@taiga-ui/kit/components/combo-box';
import { TuiDataListWrapper } from '@taiga-ui/kit/components/data-list-wrapper';

@Component({
    selector: 'app-combo-box',
    standalone: true,
    imports: [
        FormsModule,
        TuiChevron,
        TuiComboBox,
        TuiDataListWrapper,
        TuiFilterByInputPipe,
    ],
    templateUrl: './index.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboBoxComponent {
    protected readonly items = [
        'Darth Vader',
        'Luke Skywalker',
        'Princess Leia',
        'Han Solo',
        'Obi-Wan Kenobi',
        'Yoda',
    ] as const;

    protected value: string | null = this.items[0];
}
