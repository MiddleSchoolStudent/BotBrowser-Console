import { Component, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
    MatDialogModule,
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatFileUploadComponent, MatFileUploadModule } from 'mat-file-upload';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import * as localesJson from './data/locales.json';
import * as timezonesJson from './data/timezones.json';
import { map, startWith, type Observable } from 'rxjs';
import {
    type BrowserProfile,
    type BasicInfo,
    type BotProfileInfo,
    type ProxyInfo,
    type VariablesInfo,
    BrowserProfileStatus,
} from './data/browser-profile';
import {
    tryParseBotProfile,
    type BotProfileBasicInfo,
} from './data/bot-profile';
import { AlertDialogComponent } from './shared/alert-dialog.component';
import { DBService } from './shared/db.service';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';

@Component({
    selector: 'app-edit-browser-profile',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatStepperModule,
        MatFileUploadModule,
        MatAutocompleteModule,
        AsyncPipe,
    ],
    templateUrl: './edit-browser-profile.component.html',
    styleUrl: './edit-browser-profile.component.scss',
})
export class EditBrowserProfileComponent {
    readonly #formBuilder = inject(FormBuilder);
    readonly #dialog = inject(MatDialog);
    readonly #dbService = inject(DBService);
    readonly #dialogRef = inject(MatDialogRef<EditBrowserProfileComponent>);

    @ViewChild('botProfileUpload', { static: true })
    botProfileUpload!: MatFileUploadComponent;

    readonly basicInfoFormGroup: FormGroup;
    readonly botProfileInfoGroup: FormGroup;
    readonly proxyInfoGroup: FormGroup;
    readonly variablesInfoGroup: FormGroup;

    readonly #localeOptions: string[];
    readonly filteredLocales: Observable<string[]>;

    readonly #timezoneOptions: string[];
    readonly filteredTimezones: Observable<string[]>;

    #injectedData = inject<BrowserProfile | undefined>(MAT_DIALOG_DATA);

    isEdit = false;
    botProfileBasicInfo: BotProfileBasicInfo | null = null;

    constructor() {
        // init form data
        this.basicInfoFormGroup = this.#formBuilder.group<BasicInfo>({
            profileName:
                this.#injectedData?.basicInfo.profileName || 'New Profile',
            description: this.#injectedData?.basicInfo.description || '',
        });
        this.botProfileInfoGroup = this.#formBuilder.group<BotProfileInfo>({
            content: this.#injectedData?.botProfileInfo.content,
        });

        this.proxyInfoGroup = this.#formBuilder.group<ProxyInfo>({
            proxyHost: this.#injectedData?.proxyInfo.proxyHost || '',
            username: this.#injectedData?.proxyInfo.username || '',
            password: this.#injectedData?.proxyInfo.password || '',
        });
        this.variablesInfoGroup = this.#formBuilder.group<VariablesInfo>({
            locale: this.#injectedData?.variablesInfo.locale ?? 'en-US',
            noisesCanvas2d:
                this.#injectedData?.variablesInfo.noisesCanvas2d ?? true,
            noisesClientRectsFactor:
                this.#injectedData?.variablesInfo.noisesClientRectsFactor ??
                true,
            noisesCanvasWebgl:
                this.#injectedData?.variablesInfo.noisesCanvasWebgl ?? true,
            noisesTextMetricsFactor:
                this.#injectedData?.variablesInfo.noisesTextMetricsFactor ??
                true,
            noisesAudio: this.#injectedData?.variablesInfo.noisesAudio ?? true,
            timezone:
                this.#injectedData?.variablesInfo.timezone ??
                'America/New_York',
            disableConsoleMessage:
                this.#injectedData?.variablesInfo.disableConsoleMessage ?? true,
        });

        this.#localeOptions = Array.from(
            new Set(
                ((localesJson as any).default as any[]).map((e) => e.locale)
            )
        );
        this.filteredLocales = this.variablesInfoGroup
            .get('locale')
            ?.valueChanges.pipe(
                startWith(this.variablesInfoGroup.get<string>('locale')?.value),
                map((value) => {
                    const filterValue = value.toLowerCase();
                    return this.#localeOptions.filter((option) =>
                        option.toLowerCase().includes(filterValue)
                    );
                })
            ) as Observable<string[]>;

        this.#timezoneOptions = Array.from(
            new Set((timezonesJson as any).default as string[])
        );
        this.filteredTimezones = this.variablesInfoGroup
            .get('timezone')
            ?.valueChanges.pipe(
                startWith(
                    this.variablesInfoGroup.get<string>('timezone')?.value
                ),
                map((value) => {
                    const filterValue = value.toLowerCase();
                    return this.#timezoneOptions.filter((option) =>
                        option.toLowerCase().includes(filterValue)
                    );
                })
            ) as Observable<string[]>;

        if (this.#injectedData) {
            this.isEdit = true;
            if (this.#injectedData.status === BrowserProfileStatus.Running) {
                throw new Error('Cannot edit a running profile');
            }

            if (this.#injectedData.botProfileInfo.content) {
                this.botProfileBasicInfo = tryParseBotProfile(
                    this.#injectedData.botProfileInfo.content
                );
            }
        }
    }

    onSelectedBotProfileChanged(files: FileList): void {
        const file = files[0];
        if (!file) return;

        if (!this.isEdit || !this.#injectedData?.botProfileInfo.content) {
            this.#handleFileSelection(file);
            return;
        }

        // Re-selecting an existing botprofile may result in an unknown antibot error
        this.#dialog
            .open(ConfirmDialogComponent, {
                data: {
                    defaultCancel: true,
                    message:
                        'Re-selecting an existing bot profile may result in an unknown antibot error. Are you sure you want to proceed?',
                },
            })
            .afterClosed()
            .subscribe((result: boolean) => {
                if (!result) return;

                this.#handleFileSelection(file);
            });
    }

    #handleFileSelection(file: File): void {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const botProfileBasicInfo = tryParseBotProfile(content);
            if (!botProfileBasicInfo) {
                this.#dialog.open(AlertDialogComponent, {
                    data: { message: 'Invalid bot profile file.' },
                });
                this.botProfileUpload.resetFileInput();
                return;
            }

            this.botProfileBasicInfo = botProfileBasicInfo;
            this.botProfileInfoGroup.get('content')?.setValue(content);
            this.botProfileInfoGroup.get('filename')?.setValue(file.name);
            this.botProfileUpload.resetFileInput();
        };

        reader.onerror = (event) => {
            console.error('Error reading file:', event);
        };

        reader.readAsText(file);
    }

    async onConfirmClick(): Promise<void> {
        // TODO: check form data

        const browserProfile = {
            id: this.#injectedData?.id || uuidv4(),
            status: BrowserProfileStatus.Stopped,
            basicInfo: this.basicInfoFormGroup.value,
            botProfileInfo: this.botProfileInfoGroup.value,
            proxyInfo: this.proxyInfoGroup.value,
            variablesInfo: this.variablesInfoGroup.value,
            createdAt: this.#injectedData?.createdAt || Date.now(),
            updatedAt: Date.now(),
        };

        await this.#dbService.saveBrowserProfile(browserProfile);
        this.#dialogRef.close();
    }
}
