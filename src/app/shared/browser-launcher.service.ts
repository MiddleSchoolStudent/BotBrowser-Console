import { inject, Injectable } from '@angular/core';
import * as Neutralino from '@neutralinojs/lib';
import { AppName } from '../const';
import {
    BrowserProfileStatus,
    type BrowserProfile,
} from '../data/browser-profile';
import { BrowserProfileService } from './browser-profile.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from './alert-dialog.component';
import { cloneDeep } from 'lodash-es';
import { createDirectoryIfNotExists } from '../utils';

export interface RunningInfo {
    id: string;
    status: BrowserProfileStatus;
    spawnProcessInfo?: Neutralino.os.SpawnedProcess;
}

@Injectable({ providedIn: 'root' })
export class BrowserLauncherService {
    readonly #browserProfileService = inject(BrowserProfileService);
    readonly #runningStatuses = new Map<string, RunningInfo>();
    readonly #dialog = inject(MatDialog);

    constructor() {
        Neutralino.events.on('spawnedProcess', (evt) => {
            switch (evt.detail.action) {
                case 'stdOut':
                    console.log(evt.detail.data);
                    break;
                case 'stdErr':
                    console.error(evt.detail.data);
                    break;
                case 'exit':
                    console.log(
                        `process terminated with exit code: ${evt.detail.data} id: ${evt.detail.id}`
                    );

                    const runningInfo = Array.from(
                        this.#runningStatuses.values()
                    ).find(
                        (info) => info.spawnProcessInfo?.id === evt.detail.id
                    );
                    if (!runningInfo) {
                        throw new Error(
                            `No running info found for id: ${evt.detail.id}`
                        );
                    }

                    runningInfo.status = BrowserProfileStatus.Idle;
                    runningInfo.spawnProcessInfo = undefined;

                    break;
            }
        });
    }

    async getUserDataDirPath(): Promise<string> {
        const systemDataPath = await Neutralino.os.getPath('data');
        const result = `${systemDataPath}/${AppName}/user-data-dirs`;

        try {
            await Neutralino.filesystem.getStats(result);
        } catch {
            await Neutralino.filesystem.createDirectory(result);
        }

        return result;
    }

    getRunningStatus(
        browserProfile: string | BrowserProfile
    ): BrowserProfileStatus {
        const id =
            typeof browserProfile === 'string'
                ? browserProfile
                : browserProfile.id;
        return (
            this.#runningStatuses.get(id)?.status ?? BrowserProfileStatus.Idle
        );
    }

    async run(browserProfile: BrowserProfile): Promise<void> {
        if (
            this.getRunningStatus(browserProfile) !== BrowserProfileStatus.Idle
        ) {
            throw new Error('The profile is already running');
        }

        let botProfileObject: any | undefined;
        try {
            botProfileObject = JSON.parse(
                browserProfile.botProfileInfo.content ?? ''
            );
        } catch (err) {
            console.error('Error parsing bot profile content: ', err);
        }

        if (!botProfileObject) {
            this.#dialog.open(AlertDialogComponent, {
                data: { message: 'Bot profile content is empty, cannot run' },
            });
            return;
        }

        const sysTempPath = await Neutralino.os.getPath('temp');

        const variables = cloneDeep<any>(browserProfile.variableValues);
        if (browserProfile.variablesInfo.locale) {
            variables.locale = browserProfile.variablesInfo.locale;
        }
        if (browserProfile.variablesInfo.timezone) {
            variables.timezone = browserProfile.variablesInfo.timezone;
        }
        if (!browserProfile.variablesInfo.noisesCanvas2d) {
            delete variables.canvas2d;
        }
        if (!browserProfile.variablesInfo.noisesCanvasWebgl) {
            delete variables.canvasWebgl;
        }
        if (!browserProfile.variablesInfo.noisesClientRectsFactor) {
            delete variables.clientRectsFactor;
        }
        if (!browserProfile.variablesInfo.noisesTextMetricsFactor) {
            delete variables.textMetricsFactor;
        }
        if (!browserProfile.variablesInfo.noisesAudio) {
            delete variables.audio;
        }
        variables.disableConsoleMessage =
            browserProfile.variablesInfo.disableConsoleMessage ?? false;
        botProfileObject.variables = variables;

        const botProfileContent = JSON.stringify(botProfileObject);
        const botProfilesBasePath = `${sysTempPath}/${AppName}/bot-profiles`;
        await createDirectoryIfNotExists(botProfilesBasePath);
        const botProfilePath = `${botProfilesBasePath}/${browserProfile.id}.json`;
        await Neutralino.filesystem.writeFile(
            botProfilePath,
            botProfileContent
        );

        browserProfile.lastUsedAt = Date.now();
        await this.#browserProfileService.saveBrowserProfile(browserProfile);

        const browserProfilePath =
            await this.#browserProfileService.getBrowserProfilePath(
                browserProfile
            );
        const userDataDirPath = `${browserProfilePath}/user-data-dir`;

        const diskCacheDirPath = `${sysTempPath}/${AppName}/disk-cache-dir/${browserProfile.id}`;

        const execPath =
            '../BotBrowser-mac/chromium/src/out/Default/Chromium.app/Contents/MacOS/Chromium';
        const proc = await Neutralino.os.spawnProcess(
            `${execPath} --allow-pre-commit-input --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-hang-monitor --disable-infobars --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-search-engine-choice-screen --disable-sync --enable-automation --export-tagged-pdf --generate-pdf-document-outline --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --disable-features=Translate,AcceptCHFrame,MediaRouter,OptimizationHints,ProcessPerSiteUpToMainFrameThreshold,IsolateSandboxedIframes --enable-features=PdfOopif about:blank --no-sandbox --disable-blink-features=AutomationControlled --user-data-dir="${userDataDirPath}" --disk-cache-dir="${diskCacheDirPath}" --bot-profile="${botProfilePath}"`
        );

        this.#runningStatuses.set(browserProfile.id, {
            id: browserProfile.id,
            status: BrowserProfileStatus.Running,
            spawnProcessInfo: proc,
        });
    }

    async stop(browserProfile: BrowserProfile): Promise<void> {
        if (
            this.getRunningStatus(browserProfile) !==
            BrowserProfileStatus.Running
        ) {
            throw new Error('The profile is not running');
        }

        const runningInfo = this.#runningStatuses.get(browserProfile.id);
        if (!runningInfo || !runningInfo.spawnProcessInfo) {
            throw new Error('No running info found');
        }

        runningInfo.status = BrowserProfileStatus.Stopping;
        await Neutralino.os.updateSpawnedProcess(
            runningInfo.spawnProcessInfo.id,
            'exit'
        );
    }
}
