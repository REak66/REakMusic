import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

@Component({
    standalone: false,
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {

    constructor(private confirmationService: ConfirmationService) { }

    ngOnInit(): void { }

    ngOnDestroy(): void { }

    accept(message?: any): void {
        if (message && typeof message.accept === 'function') {
            message.accept();
        }
        this.confirmationService.close();
    }

    reject(message?: any): void {
        if (message && typeof message.reject === 'function') {
            message.reject();
        }
        this.confirmationService.close();
    }
}
