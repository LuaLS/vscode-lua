import * as vscode from "vscode";
import filesystem from "./filesystem.service";
import { createChildLogger } from "./logging.service";
import { Addon } from "../models/addon";
import { git } from "./git.service";
import { DiffResultTextFile } from "simple-git";

const localLogger = createChildLogger("Addon Manager");

class AddonManager {
    readonly addons: Map<string, Addon>;

    constructor() {
        this.addons = new Map();
    }

    public async fetchAddons(installLocation: vscode.Uri) {
        const addons = await filesystem.readDirectory(installLocation);

        for (const addon of addons) {
            this.addons.set(addon.name, new Addon(addon.name, addon.uri));
            localLogger.verbose(`Found ${addon.name}`);
        }

        return await this.checkUpdated();
    }

    /** Get a page of local addons */
    public getAddonsPage(page: number, pageSize: number): Addon[] {
        const start = (page - 1) * pageSize;
        const addons = Array.from(this.addons.values());

        addons.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return addons.slice(start, start + pageSize);
    }

    public async checkUpdated() {
        const diff = await git.diffSummary([
            "main",
            "origin/main",
        ]);
        this.addons.forEach((addon) => {
            addon.checkForUpdate(diff.files as DiffResultTextFile[]);
        });
    }

    public unlockAddon(name: string) {
        const addon = this.addons.get(name);
        return addon.setLock(false);
    }
}

export default new AddonManager();
