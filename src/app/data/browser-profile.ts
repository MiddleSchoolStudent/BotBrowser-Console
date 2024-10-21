export interface BasicInfo {
    profileName: string;
    description?: string;
}

export interface ProfileInfo {
    profilePath?: string;
    profileContent?: any;
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

export interface BrowserProfile {
    status?: BrowserProfileStatus;
    basicInfo: BasicInfo;
    profileInfo: ProfileInfo;
    proxyInfo: ProxyInfo;
    variablesInfo: VariablesInfo;
    createdAt: number;
    updatedAt: number;
    lastUsedAt?: number;
    deletedAt?: number;
}
