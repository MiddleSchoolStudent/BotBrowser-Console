import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-alert-dialog',
    template: `
        <h1 mat-dialog-title *ngIf="data.title">{{ data.title }}</h1>
        <div mat-dialog-content>{{ data.message }}</div>
        <div mat-dialog-actions>
            <button mat-button (click)="onClose()">OK</button>
        </div>
    `,
})
export class AlertDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<AlertDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
    ) {}

    onClose(): void {
        this.dialogRef.close();
    }
}
