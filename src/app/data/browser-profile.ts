export interface BasicInfo {
    profileName: string;
    description?: string;
}

export interface BotProfileInfo {
    filename?: string;
    content?: string;
}

export interface ProxyInfo {
    proxyHost?: string;
    username?: string;
    password?: string;
}

export interface VariablesInfo {
    locale?: string;
    timezone?: string;
    noisesCanvas2d?: boolean;
    noisesCanvasWebgl?: boolean;
    noisesClientRectsFactor?: boolean;
    noisesTextMetricsFactor?: boolean;
    noisesAudio?: boolean;
    disableConsoleMessage?: boolean;
}

export enum BrowserProfileStatus {
    Idle,
    Launching,
    LaunchFailed,
    Running,
    Stopping,
    StopFailed,
}

export const BrowserProfileStatusText = {
    [BrowserProfileStatus.Idle]: 'Idle',
    [BrowserProfileStatus.Launching]: 'Launching',
    [BrowserProfileStatus.LaunchFailed]: 'Launch Failed',
    [BrowserProfileStatus.Running]: 'Running',
    [BrowserProfileStatus.Stopping]: 'Stopping',
    [BrowserProfileStatus.StopFailed]: 'Stop Failed',
};

export function getBrowserProfileStatusText(
    status: BrowserProfileStatus
): string {
    return BrowserProfileStatusText[status];
}

export interface BrowserProfile {
    id: string;
    basicInfo: BasicInfo;
    botProfileInfo: BotProfileInfo;
    proxyInfo: ProxyInfo;
    variablesInfo: VariablesInfo;
    createdAt: number;
    updatedAt: number;
    lastUsedAt?: number;
    deletedAt?: number;
    variableValues: {
        storageQuotaInBytes: number;
        noises: {
            clientRectsFactor: number;
            textMetricsFactor: number;
            canvas2d: number[];
            canvasWebgl: number[];
            audio: number[];
        };
    };
}
