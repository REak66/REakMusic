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

    accept(): void {
        this.confirmationService.close();
    }

    reject(): void {
        this.confirmationService.close();
    }
}
