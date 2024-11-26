import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import * as Neutralino from '@neutralinojs/lib';
import { compact, shuffle } from 'lodash-es';
import { map, startWith, type Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
    tryParseBotProfile,
    type BotProfileBasicInfo,
} from './data/bot-profile';
import {
    BrowserProfileStatus,
    type BasicInfo,
    type BotProfileInfo,
    type BrowserProfile,
    type ProxyInfo,
    type VariablesInfo,
} from './data/browser-profile';
import * as localesJson from './data/locales.json';
import * as timezonesJson from './data/timezones.json';
import { AlertDialogComponent } from './shared/alert-dialog.component';
import { BrowserLauncherService } from './shared/browser-launcher.service';
import { BrowserProfileService } from './shared/browser-profile.service';
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
        MatAutocompleteModule,
        AsyncPipe,
    ],
    templateUrl: './edit-browser-profile.component.html',
    styleUrl: './edit-browser-profile.component.scss',
})
export class EditBrowserProfileComponent {
    readonly #browserProfileService = inject(BrowserProfileService);
    readonly #browserLauncherService = inject(BrowserLauncherService);

    #injectedData = inject<BrowserProfile | undefined>(MAT_DIALOG_DATA);

    readonly #formBuilder = inject(FormBuilder);
    readonly #dialog = inject(MatDialog);
    readonly #dialogRef = inject(MatDialogRef<EditBrowserProfileComponent>);

    readonly basicInfoFormGroup = this.#formBuilder.group<BasicInfo>({
        profileName: this.#injectedData?.basicInfo.profileName || 'New Profile',
        groupName: this.#injectedData?.basicInfo.groupName || '',
        description: this.#injectedData?.basicInfo.description || '',
    });
    #groupNames: string[] = [];
    readonly filteredGroupNames = this.basicInfoFormGroup.valueChanges.pipe(
        startWith(this.basicInfoFormGroup.value),
        map((value) => {
            const filterValue = value.groupName?.toLowerCase();
            return this.#groupNames.filter((option) =>
                option.toLowerCase().includes(filterValue || '')
            );
        })
    );

    readonly botProfileInfoGroup = this.#formBuilder.group<BotProfileInfo>({
        filename: this.#injectedData?.botProfileInfo.filename || '',
        content: this.#injectedData?.botProfileInfo.content,
    });
    readonly proxyInfoGroup = this.#formBuilder.group<ProxyInfo>({
        proxyHost: this.#injectedData?.proxyInfo.proxyHost || '',
        username: this.#injectedData?.proxyInfo.username || '',
        password: this.#injectedData?.proxyInfo.password || '',
    });
    readonly variablesInfoGroup = this.#formBuilder.group<VariablesInfo>({
        locale: this.#injectedData?.variablesInfo.locale ?? 'en-US',
        noisesCanvas2d:
            this.#injectedData?.variablesInfo.noisesCanvas2d ?? true,
        noisesClientRectsFactor:
            this.#injectedData?.variablesInfo.noisesClientRectsFactor ?? true,
        noisesCanvasWebgl:
            this.#injectedData?.variablesInfo.noisesCanvasWebgl ?? true,
        noisesTextMetricsFactor:
            this.#injectedData?.variablesInfo.noisesTextMetricsFactor ?? true,
        noisesAudio: this.#injectedData?.variablesInfo.noisesAudio ?? true,
        timezone:
            this.#injectedData?.variablesInfo.timezone ?? 'America/New_York',
        disableConsoleMessage:
            this.#injectedData?.variablesInfo.disableConsoleMessage ?? true,
    });

    readonly #localeOptions: string[];
    readonly filteredLocales: Observable<string[]>;

    readonly #timezoneOptions: string[];
    readonly filteredTimezones: Observable<string[]>;

    isEdit = false;
    botProfileBasicInfo: BotProfileBasicInfo | null = null;

    constructor() {
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

            const status = this.#browserLauncherService.getRunningStatus(
                this.#injectedData
            );
            if (status !== BrowserProfileStatus.Idle) {
                throw new Error('Cannot edit a running profile');
            }

            if (this.#injectedData.botProfileInfo.content) {
                this.botProfileBasicInfo = tryParseBotProfile(
                    this.#injectedData.botProfileInfo.content
                );
            }
        }

        this.#browserProfileService.getAllBrowserProfiles().then((profiles) => {
            this.#groupNames = compact(
                profiles.map((profile) => profile.basicInfo.groupName)
            );
        });
    }

    async chooseFile(): Promise<void> {
        const entries = await Neutralino.os.showOpenDialog('Select a profile', {
            filters: [{ name: 'Profiles', extensions: ['json', 'enc'] }],
            multiSelections: false,
        });
        const entry = entries[0];
        if (!entry) return;

        if (!this.isEdit || !this.#injectedData?.botProfileInfo.content) {
            this.#handleFileSelection(entry);
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
                this.#handleFileSelection(entry);
            });
    }

    #handleFileSelection(filePath: string): void {
        Neutralino.filesystem.readFile(filePath).then((content) => {
            const botProfileBasicInfo = tryParseBotProfile(content);
            if (!botProfileBasicInfo) {
                this.#dialog.open(AlertDialogComponent, {
                    data: { message: 'Invalid bot profile file.' },
                });
                return;
            }

            this.botProfileBasicInfo = botProfileBasicInfo;
            this.botProfileInfoGroup.get('content')?.setValue(content);
            this.botProfileInfoGroup.get('filename')?.setValue(filePath);
        });
    }

    async onConfirmClick(): Promise<void> {
        if (!this.basicInfoFormGroup.valid) {
            return;
        }

        const browserProfile: BrowserProfile = {
            id: this.#injectedData?.id || uuidv4(),
            basicInfo: this.basicInfoFormGroup.value,
            botProfileInfo: this.botProfileInfoGroup.value,
            proxyInfo: this.proxyInfoGroup.value,
            variablesInfo: this.variablesInfoGroup.value,
            variableValues: this.#injectedData?.variableValues || {
                storageQuotaInBytes:
                    590000000000 + Math.floor(Math.random() * 9000000000),
                noises: {
                    clientRectsFactor: 1.0 + Math.random() * 0.004,
                    textMetricsFactor: 1.0 + Math.random() * 0.004,
                    canvas2d: [
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                    ],
                    canvasWebgl: [
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                        Math.round(Math.random() * 20),
                    ],
                    audio: shuffle([0.01, 0.03, 0.01, 0.04, 0.02]),
                },
            },
            createdAt: this.#injectedData?.createdAt || Date.now(),
            lastUsedAt: this.#injectedData?.lastUsedAt,
            updatedAt: Date.now(),
            warmupUrls: this.#injectedData?.warmupUrls,
        };

        await this.#browserProfileService.saveBrowserProfile(browserProfile);
        this.#dialogRef.close();
    }
}
