import { Component, inject } from '@angular/core';
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
import { MatFileUploadModule } from 'mat-file-upload';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
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
import { DBService } from './service/db.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
    selector: 'app-edit-browser-profile',
    standalone: true,
    imports: [
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

    constructor(
        private dialog: MatDialog,
        private dbService: DBService,
        public dialogRef: MatDialogRef<EditBrowserProfileComponent>
    ) {
        // init form data
        this.basicInfoFormGroup = this.#formBuilder.group<BasicInfo>({
            profileName:
                this.#injectedData?.basicInfo.profileName || 'New Profile',
            description: this.#injectedData?.basicInfo.description || '',
        });
        this.botProfileInfoGroup = this.#formBuilder.group<BotProfileInfo>({
            botProfileContent:
                this.#injectedData?.botProfileInfo.botProfileContent,
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

            if (this.#injectedData.botProfileInfo.botProfileContent) {
                this.botProfileBasicInfo = tryParseBotProfile(
                    this.#injectedData.botProfileInfo.botProfileContent
                );
            }
        }
    }

    onSelectedBotProfileChanged(files: FileList): void {
        const file = files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const botProfileBasicInfo = tryParseBotProfile(content);
            if (!botProfileBasicInfo) {
                this.dialog.open(AlertDialogComponent, {
                    data: { message: 'Invalid bot profile file' },
                });
                return;
            }

            this.botProfileBasicInfo = botProfileBasicInfo;
            this.botProfileInfoGroup
                .get('botProfileContent')
                ?.setValue(content);
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

        await this.dbService.saveBrowserProfile(browserProfile);
        this.dialogRef.close();
    }
}
