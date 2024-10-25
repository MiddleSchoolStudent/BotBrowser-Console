import { openDB, type IDBPDatabase } from 'idb';
import { Injectable } from '@angular/core';
import type { BrowserProfile } from '../data/browser-profile';

@Injectable({ providedIn: 'root' })
export class DBService {
    #db: IDBPDatabase | null = null;

    async getDB(): Promise<IDBPDatabase> {
        if (!this.#db) {
            this.#db = await openDB('bot-browser-console', 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('browserProfiles')) {
                        db.createObjectStore('browserProfiles', {
                            keyPath: 'id',
                        });
                    }
                },
            });
        }

        return this.#db;
    }

    async saveBrowserProfile(browserProfile: BrowserProfile): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('browserProfiles', 'readwrite');
        const store = tx.objectStore('browserProfiles');
        await store.put(browserProfile);
        await tx.done;
    }

    async getAllBrowserProfiles(): Promise<BrowserProfile[]> {
        const db = await this.getDB();
        return await db.getAll('browserProfiles');
    }

    async getBrowserProfile(id: string): Promise<BrowserProfile | undefined> {
        const db = await this.getDB();
        return await db.get('browserProfiles', id);
    }

    async deleteBrowserProfile(id: string | BrowserProfile): Promise<void> {
        if (typeof id !== 'string') {
            id = id.id;
        }

        const db = await this.getDB();
        const tx = db.transaction('browserProfiles', 'readwrite');
        const store = tx.objectStore('browserProfiles');
        await store.delete(id);
        await tx.done;
    }

    async deleteBrowserProfiles(ids: string[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('browserProfiles', 'readwrite');
        const store = tx.objectStore('browserProfiles');
        for (const id of ids) {
            await store.delete(id);
        }
        await tx.done;
    }
}
