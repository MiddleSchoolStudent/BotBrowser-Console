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
import { DBService } from './service/db.service';
import { CommonModule } from '@angular/common';

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
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
    readonly formatDateTime = formatDateTime;
    readonly getBrowserProfileStatusText = getBrowserProfileStatusText;
    readonly BrowserProfileStatus = BrowserProfileStatus;
    readonly dialog = inject(MatDialog);
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

    title = 'BotBrowser-Console';

    constructor(private readonly dbService: DBService) {}

    newProfile(): void {
        const dialogRef = this.dialog.open(EditBrowserProfileComponent);

        dialogRef.afterClosed().subscribe((result) => {
            console.log(`Dialog result: ${result}`);
            this.refreshProfiles().then().catch(console.error);
        });
    }

    editProfile(browserProfile: BrowserProfile): void {
        const dialogRef = this.dialog.open(EditBrowserProfileComponent, {
            data: browserProfile,
        });

        dialogRef.afterClosed().subscribe((result) => {
            console.log(`Dialog result: ${result}`);
            this.refreshProfiles().then().catch(console.error);
        });
    }

    importProfile(): void {}

    deleteProfiles(): void {}

    async refreshProfiles(): Promise<void> {
        const profiles = await this.dbService.getAllBrowserProfiles();
        this.dataSource.data = profiles;
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
