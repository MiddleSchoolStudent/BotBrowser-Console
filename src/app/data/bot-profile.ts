export interface BotProfileBasicInfo {
    version: string;
    userAgent: string;
}

export function tryParseBotProfile(data: string): BotProfileBasicInfo | null {
    try {
        const info = JSON.parse(data);
        const version = info.version;
        const userAgent = info.fingerprints.browser.navigator.userAgent;
        if (typeof version === 'string' && typeof userAgent === 'string') {
            return { version, userAgent };
        }

        return null;
    } catch {
        return null;
    }
}
