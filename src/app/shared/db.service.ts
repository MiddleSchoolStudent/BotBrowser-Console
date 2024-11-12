import { Injectable } from '@angular/core';
import * as Neutralino from '@neutralinojs/lib';
import type { BrowserProfile } from '../data/browser-profile';

const kBrowserProfilePrefix = 'browserProfiles';

@Injectable({ providedIn: 'root' })
export class DBService {
    async saveBrowserProfile(browserProfile: BrowserProfile): Promise<void> {
        await Neutralino.storage.setData(
            `${kBrowserProfilePrefix}_${browserProfile.id}`,
            JSON.stringify(browserProfile)
        );
    }

    async getAllBrowserProfiles(): Promise<BrowserProfile[]> {
        const keys = (await Neutralino.storage.getKeys()).filter((key) =>
            key.startsWith(kBrowserProfilePrefix)
        );
        const result = await Promise.all(
            keys.map(async (key) => {
                const browserProfile = await Neutralino.storage.getData(key);
                return JSON.parse(browserProfile);
            })
        );

        result.sort((a, b) => b.createdAt - a.createdAt);
        return result;
    }

    async getBrowserProfile(
        browserProfile: string | BrowserProfile
    ): Promise<BrowserProfile | undefined> {
        const id =
            typeof browserProfile === 'string'
                ? browserProfile
                : browserProfile.id;

        const browserProfileData = await Neutralino.storage.getData(
            `${kBrowserProfilePrefix}_${id}`
        );
        return JSON.parse(browserProfileData);
    }

    async deleteBrowserProfile(
        browserProfile: string | BrowserProfile
    ): Promise<void> {
        const id =
            typeof browserProfile === 'string'
                ? browserProfile
                : browserProfile.id;

        await Neutralino.storage.setData(
            `${kBrowserProfilePrefix}_${id}`,
            null as any
        );
    }

    async deleteBrowserProfiles(
        browserProfiles: (string | BrowserProfile)[]
    ): Promise<void> {
        await Promise.all(
            browserProfiles.map((browserProfile) =>
                this.deleteBrowserProfile(browserProfile)
            )
        );
    }
}
