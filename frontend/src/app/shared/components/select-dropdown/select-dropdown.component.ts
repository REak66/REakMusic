import {
    Component,
    Input,
    Output,
    EventEmitter,
    forwardRef,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    DestroyRef,
    inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TuiFilterByInputPipe, TuiTextfield, TuiDropdown } from '@taiga-ui/core';
import { TuiChevron, TuiComboBox, TuiDataListWrapper } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SelectOption {
    value: any;
    label: string;
    icon?: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-select-dropdown',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TuiChevron,
        TuiComboBox,
        TuiDataListWrapper,
        TuiFilterByInputPipe,
        TuiTextfield,
        TuiDropdown,
    ],
    templateUrl: './select-dropdown.component.html',
    styleUrls: ['./select-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectDropdownComponent),
            multi: true
        }
    ]
})
export class SelectDropdownComponent implements ControlValueAccessor, OnChanges {
    @Input() options: SelectOption[] = [];
    @Input() placeholder = 'Select an option';
    @Input() disabled = false;
    @Input() id = '';
    @Input() compact = false;
    @Output() selectionChange = new EventEmitter<any>();

    // Internal form control to bind with TuiComboBox
    protected readonly control = new FormControl<SelectOption | null>(null);

    protected readonly stringify = (item: SelectOption): string => item?.label || '';

    private onChange: (value: any) => void = () => { };
    private onTouched: () => void = () => { };
    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        // Subscribe to internal control changes and propagate primitive value to parent
        this.control.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(option => {
                const rawValue = option ? option.value : null;
                this.onChange(rawValue);
                this.selectionChange.emit(rawValue);
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['disabled']) {
            if (this.disabled) {
                this.control.disable({ emitEvent: false });
            } else {
                this.control.enable({ emitEvent: false });
            }
        }
        if (changes['options'] && this.control.value) {
            // Check if the current value is still a valid option in the new list
            const exists = this.options.some(o => o.value === this.control.value?.value);
            if (!exists) {
                this.control.setValue(null, { emitEvent: true });
            }
        }
    }

    // ControlValueAccessor methods
    writeValue(value: any): void {
        const option = this.options.find(o => o.value === value) || null;
        this.control.setValue(option, { emitEvent: false });
    }

    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        if (isDisabled) {
            this.control.disable({ emitEvent: false });
        } else {
            this.control.enable({ emitEvent: false });
        }
    }

    onBlur(): void {
        this.onTouched();
    }
}
