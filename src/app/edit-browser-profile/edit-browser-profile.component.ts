import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
import * as localesJson from '../data/locales.json';
import * as timezonesJson from '../data/timezones.json';
import { map, startWith, type Observable } from 'rxjs';
import type {
    BrowserProfile,
    BasicInfo,
    ProfileInfo,
    ProxyInfo,
    VariablesInfo,
} from '../data/browser-profile';

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
    readonly profileInfoGroup: FormGroup;
    readonly proxyInfoGroup: FormGroup;
    readonly variablesInfoGroup: FormGroup;

    readonly #localeOptions: string[];
    readonly filteredLocales: Observable<string[]>;

    readonly #timezoneOptions: string[];
    readonly filteredTimezones: Observable<string[]>;

    #injectedData = inject<BrowserProfile | undefined>(MAT_DIALOG_DATA);

    isEdit = false;

    constructor() {
        // init form data
        this.basicInfoFormGroup = this.#formBuilder.group<BasicInfo>({
            profileName:
                this.#injectedData?.basicInfo.profileName || 'New Profile',
            description: this.#injectedData?.basicInfo.description || '',
        });
        this.profileInfoGroup = this.#formBuilder.group<ProfileInfo>({});
        this.proxyInfoGroup = this.#formBuilder.group<ProxyInfo>({
            proxyHost: '',
            username: '',
            password: '',
        });
        this.variablesInfoGroup = this.#formBuilder.group<VariablesInfo>({
            locale: 'en-US',
            noisesCanvas2d: true,
            noisesClientRectsFactor: true,
            noisesCanvasWebgl: true,
            noisesTextMetricsFactor: true,
            noisesAudio: true,
            timezone: 'America/New_York',
            disableConsoleMessage: true,
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
    }

    onSelectedFilesChanged(_files: FileList): void {
        console.log(_files);
    }
}
