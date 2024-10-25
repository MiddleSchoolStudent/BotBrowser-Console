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
    Stopped = 0,
    Running = 1,
}

export const BrowserProfileStatusText = {
    [BrowserProfileStatus.Stopped]: 'Stopped',
    [BrowserProfileStatus.Running]: 'Running',
};

export function getBrowserProfileStatusText(
    status: BrowserProfileStatus
): string {
    return BrowserProfileStatusText[status];
}

export interface BrowserProfile {
    id: string;
    status?: BrowserProfileStatus;
    basicInfo: BasicInfo;
    botProfileInfo: BotProfileInfo;
    proxyInfo: ProxyInfo;
    variablesInfo: VariablesInfo;
    createdAt: number;
    updatedAt: number;
    lastUsedAt?: number;
    deletedAt?: number;
}
