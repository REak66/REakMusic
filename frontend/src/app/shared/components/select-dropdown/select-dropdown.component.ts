import {
    Component,
    Input,
    Output,
    EventEmitter,
    forwardRef,
    HostListener,
    ElementRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
    value: any;
    label: string;
    disabled?: boolean;
}

@Component({
    standalone: false,
    selector: 'app-select-dropdown',
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

    isOpen = false;
    selectedValue: any = null;
    focusedIndex = -1;

    private onChange: (value: any) => void = () => { };
    private onTouched: () => void = () => { };

    constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options'] && this.selectedValue !== null) {
            const exists = this.options.some(o => o.value === this.selectedValue);
            if (!exists) {
                this.selectedValue = null;
            }
        }
    }

    get selectedLabel(): string {
        const opt = this.options.find(o => o.value === this.selectedValue);
        return opt ? opt.label : '';
    }

    toggle(): void {
        if (this.disabled) return;
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.focusedIndex = this.options.findIndex(o => o.value === this.selectedValue);
            if (this.focusedIndex < 0) this.focusedIndex = 0;
        }
        this.cdr.markForCheck();
    }

    select(option: SelectOption): void {
        if (option.disabled) return;
        this.selectedValue = option.value;
        this.onChange(option.value);
        this.onTouched();
        this.selectionChange.emit(option.value);
        this.cdr.markForCheck();
        // Defer close so the panel stays in DOM during the click event cycle.
        // This ensures stopPropagation on the <li> fires before Angular removes the panel.
        setTimeout(() => {
            this.isOpen = false;
            this.cdr.markForCheck();
        }, 0);
    }

    isSelected(option: SelectOption): boolean {
        return this.selectedValue === option.value;
    }

    onOptionMouseDown(event: MouseEvent): void {
        // Prevent focus loss on mousedown; selection is handled by the click event.
        event.preventDefault();
        event.stopPropagation();
    }

    onOptionClick(option: SelectOption, event: MouseEvent): void {
        event.stopPropagation();
        this.select(option);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.elRef.nativeElement.contains(event.target)) {
            if (this.isOpen) {
                this.isOpen = false;
                this.cdr.markForCheck();
            }
        }
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (this.disabled) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!this.isOpen) {
                    this.toggle();
                } else if (this.focusedIndex >= 0 && this.focusedIndex < this.options.length) {
                    this.select(this.options[this.focusedIndex]);
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!this.isOpen) {
                    this.toggle();
                } else {
                    this.moveFocus(1);
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (this.isOpen) {
                    this.moveFocus(-1);
                }
                break;
            case 'Escape':
                this.isOpen = false;
                this.cdr.markForCheck();
                break;
            case 'Tab':
                if (this.isOpen) {
                    this.isOpen = false;
                    this.cdr.markForCheck();
                }
                break;
        }
    }

    private moveFocus(direction: 1 | -1): void {
        let next = this.focusedIndex + direction;
        while (next >= 0 && next < this.options.length && this.options[next].disabled) {
            next += direction;
        }
        if (next >= 0 && next < this.options.length) {
            this.focusedIndex = next;
            this.cdr.markForCheck();
        }
    }

    // ControlValueAccessor
    writeValue(value: any): void {
        this.selectedValue = value ?? null;
        this.cdr.markForCheck();
    }

    registerOnChange(fn: (value: any) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.cdr.markForCheck();
    }
}
