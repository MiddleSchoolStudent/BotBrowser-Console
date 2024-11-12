import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import {
    Component,
    inject,
    ViewChild,
    type AfterViewInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import { CloneBrowserProfileComponent } from './clone-browser-profile.component';
import { AppName } from './const';
import {
    BrowserProfileStatus,
    getBrowserProfileStatusText,
    type BrowserProfile,
} from './data/browser-profile';
import { EditBrowserProfileComponent } from './edit-browser-profile.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { BrowserProfileService } from './shared/browser-profile.service';
import { StopPropagationDirective } from './shared/stop-propagation.directive';
import { formatDateTime } from './utils';

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
    readonly #dbService = inject(BrowserProfileService);
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

    constructor() {}

    newProfile(): void {
        this.#dialog
            .open(EditBrowserProfileComponent)
            .afterClosed()
            .subscribe((result) => {
                console.log(`Dialog result: ${result}`);
                this.refreshProfiles().then().catch(console.error);
            });
    }

    editProfile(browserProfile: BrowserProfile): void {
        this.#dialog
            .open(EditBrowserProfileComponent, {
                data: browserProfile,
            })
            .afterClosed()
            .subscribe((result) => {
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

    cloneProfile(browserProfile: BrowserProfile): void {
        this.#dialog
            .open(CloneBrowserProfileComponent)
            .afterClosed()
            .subscribe(async (result: number) => {
                await Promise.all(
                    Array.from({ length: result }).map(() => {
                        const newProfile = cloneDeep(browserProfile);
                        newProfile.id = uuidv4();
                        newProfile.createdAt = Date.now();
                        newProfile.updatedAt = Date.now();
                        return this.#dbService.saveBrowserProfile(newProfile);
                    })
                );

                await this.refreshProfiles();
            });
    }

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

                await this.#dbService.deleteBrowserProfiles(
                    this.selection.selected.map((profile) => profile.id)
                );
                await this.refreshProfiles();
            });
    }

    async refreshProfiles(): Promise<void> {
        const profiles = await this.#dbService.getAllBrowserProfiles();
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
