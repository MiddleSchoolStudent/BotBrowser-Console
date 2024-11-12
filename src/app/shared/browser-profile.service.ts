import { Injectable } from '@angular/core';
import * as Neutralino from '@neutralinojs/lib';
import type { BrowserProfile } from '../data/browser-profile';
import { AppName } from '../const';

@Injectable({ providedIn: 'root' })
export class BrowserProfileService {
    async getBrowserProfilePath(): Promise<string> {
        const systemDataPath = await Neutralino.os.getPath('data');
        const appDataPath = `${systemDataPath}/${AppName}/browser-profiles`;

        try {
            await Neutralino.filesystem.getStats(appDataPath);
        } catch {
            await Neutralino.filesystem.createDirectory(appDataPath);
        }

        return appDataPath;
    }

    async saveBrowserProfile(browserProfile: BrowserProfile): Promise<void> {
        const browserProfilePath = await this.getBrowserProfilePath();
        await Neutralino.filesystem.writeFile(
            `${browserProfilePath}/${browserProfile.id}.json`,
            JSON.stringify(browserProfile)
        );
    }

    async getAllBrowserProfiles(): Promise<BrowserProfile[]> {
        const browserProfilePath = await this.getBrowserProfilePath();
        const entries =
            await Neutralino.filesystem.readDirectory(browserProfilePath);

        const result = await Promise.all(
            entries.map(async (entry) => {
                const content = await Neutralino.filesystem.readFile(
                    entry.path
                );
                return JSON.parse(content);
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

        const browserProfilePath = await this.getBrowserProfilePath();
        const content = await Neutralino.filesystem.readFile(
            `${browserProfilePath}/${id}.json`
        );
        return JSON.parse(content);
    }

    async deleteBrowserProfile(
        browserProfile: string | BrowserProfile
    ): Promise<void> {
        const id =
            typeof browserProfile === 'string'
                ? browserProfile
                : browserProfile.id;

        const browserProfilePath = await this.getBrowserProfilePath();
        await Neutralino.filesystem.remove(`${browserProfilePath}/${id}.json`);
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
