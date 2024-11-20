import { Injectable } from '@angular/core';
import * as Neutralino from '@neutralinojs/lib';
import { compact } from 'lodash-es';
import type { BrowserProfile } from '../data/browser-profile';
import { createDirectoryIfNotExists, getAppDataPath } from '../utils';

export const kProfileConfigFileName = 'profile-config.json';

@Injectable({ providedIn: 'root' })
export class BrowserProfileService {
    async getBasePath(): Promise<string> {
        const result = await getAppDataPath('browser-profiles');
        return result;
    }

    async getBrowserProfilePath(browserProfile: string | BrowserProfile) {
        const id =
            typeof browserProfile === 'string'
                ? browserProfile
                : browserProfile.id;

        const basePath = await this.getBasePath();
        const browserProfilePath = `${basePath}/${id}`;
        await createDirectoryIfNotExists(browserProfilePath);
        return browserProfilePath;
    }

    async saveBrowserProfile(browserProfile: BrowserProfile): Promise<void> {
        const browserProfilePath =
            await this.getBrowserProfilePath(browserProfile);
        await Neutralino.filesystem.writeFile(
            `${browserProfilePath}/${kProfileConfigFileName}`,
            JSON.stringify(browserProfile)
        );
    }

    async getAllBrowserProfiles(): Promise<BrowserProfile[]> {
        const browserProfilePath = await this.getBasePath();
        const entries =
            await Neutralino.filesystem.readDirectory(browserProfilePath);

        const result = compact(
            await Promise.all(
                entries.map(async (entry) => {
                    if (entry.type == 'FILE') return;

                    try {
                        const content = await Neutralino.filesystem.readFile(
                            `${entry.path}/${kProfileConfigFileName}`
                        );
                        return JSON.parse(content);
                    } catch {}
                })
            )
        );

        result.sort((a, b) => b.createdAt - a.createdAt);
        return result;
    }

    async getBrowserProfile(
        browserProfile: string | BrowserProfile
    ): Promise<BrowserProfile | undefined> {
        const browserProfilePath =
            await this.getBrowserProfilePath(browserProfile);
        const content = await Neutralino.filesystem.readFile(
            `${browserProfilePath}/${kProfileConfigFileName}`
        );
        return JSON.parse(content);
    }

    async deleteBrowserProfile(
        browserProfile: string | BrowserProfile
    ): Promise<void> {
        const browserProfilePath =
            await this.getBrowserProfilePath(browserProfile);
        await Neutralino.filesystem.remove(browserProfilePath);
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