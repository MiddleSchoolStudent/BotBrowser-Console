import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatStepperModule,
        MatAutocompleteModule,
        AsyncPipe,
    ],
    templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
    readonly #dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public data: {
            title?: string;
            message: string;
            defaultCancel?: boolean;
            okButtonText?: string;
            cancelButtonText?: string;
        }
    ) {}

    onOk(): void {
        this.#dialogRef.close(true);
    }

    onCancel(): void {
        this.#dialogRef.close(false);
    }
}
