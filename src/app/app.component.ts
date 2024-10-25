import {
    Component,
    inject,
    ViewChild,
    type AfterViewInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { EditBrowserProfileComponent } from './edit-browser-profile.component';
import { formatDateTime } from './utils';
import {
    BrowserProfileStatus,
    getBrowserProfileStatusText,
    type BrowserProfile,
} from './data/browser-profile';
import { SelectionModel } from '@angular/cdk/collections';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { DBService } from './shared/db.service';
import { CommonModule } from '@angular/common';
import { StopPropagationDirective } from './shared/stop-propagation.directive';
import { AppName } from './const';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        MatButtonModule,
        MatMenuModule,
        MatDialogModule,
        MatTableModule,
        MatSortModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatIconModule,
        StopPropagationDirective,
        ConfirmDialogComponent,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
    readonly AppName = AppName;
    readonly #dialog = inject(MatDialog);
    readonly formatDateTime = formatDateTime;
    readonly getBrowserProfileStatusText = getBrowserProfileStatusText;
    readonly BrowserProfileStatus = BrowserProfileStatus;
    readonly displayedColumns = [
        'select',
        'name',
        'status',
        'lastUsedAt',
        'updatedAt',
        'createdAt',
    ];
    readonly dataSource = new MatTableDataSource<BrowserProfile>([]);
    readonly selection = new SelectionModel<BrowserProfile>(true, []);

    @ViewChild(MatSort) sort!: MatSort;

    constructor(private readonly dbService: DBService) {}

    newProfile(): void {
        const dialogRef = this.#dialog.open(EditBrowserProfileComponent);

        dialogRef.afterClosed().subscribe((result) => {
            console.log(`Dialog result: ${result}`);
            this.refreshProfiles().then().catch(console.error);
        });
    }

    editProfile(browserProfile: BrowserProfile): void {
        const dialogRef = this.#dialog.open(EditBrowserProfileComponent, {
            data: browserProfile,
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log(`Dialog result: ${result}`);
            this.refreshProfiles().then().catch(console.error);
        });
    }

    editSelectedProfile(): void {
        if (this.selection.selected.length !== 1) {
            throw new Error('Please select one profile to edit');
        }

        this.editProfile(this.selection.selected[0]!);
    }

    toggleSelectProfile(browserProfile: BrowserProfile): void {
        this.selection.toggle(browserProfile);
    }

    importProfile(): void {}

    deleteProfiles(): void {
        if (this.selection.selected.length === 0) {
            throw new Error('Please select profiles to delete');
        }

        this.#dialog
            .open(ConfirmDialogComponent, {
                data: {
                    message:
                        'Are you sure you want to delete the selected profiles?',
                },
            })
            .afterClosed()
            .subscribe(async (result: boolean) => {
                if (!result) return;

                await this.dbService.deleteBrowserProfiles(
                    this.selection.selected.map((profile) => profile.id)
                );
                await this.refreshProfiles();
            });
    }

    async refreshProfiles(): Promise<void> {
        const profiles = await this.dbService.getAllBrowserProfiles();
        const selectedIds = this.selection.selected.map(
            (profile) => profile.id
        );
        this.dataSource.data = profiles;

        this.selection.clear();
        this.selection.select(
            ...profiles.filter((profile) => selectedIds.includes(profile.id))
        );
    }

    async ngAfterViewInit() {
        this.dataSource.sort = this.sort;
        await this.refreshProfiles();
    }

    get isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    toggleAllRows() {
        if (this.isAllSelected) {
            this.selection.clear();
            return;
        }

        this.selection.select(...this.dataSource.data);
    }

    checkboxLabel(row?: BrowserProfile): string {
        if (!row) {
            return `${this.isAllSelected ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
    }
}
