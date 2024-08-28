import * as vscode from "vscode";
import filesystem from "./filesystem.service";
import { createChildLogger } from "./logging.service";
import { Addon } from "../models/addon";
import { git } from "./git.service";
import { DiffResultTextFile } from "simple-git";
import { WebVue } from "../panels/WebVue";
import { NotificationLevels } from "../types/webvue";

const localLogger = createChildLogger("Addon Manager");

class AddonManager {
    readonly addons: Map<string, Addon>;

    constructor() {
        this.addons = new Map();
    }

    public async fetchAddons(installLocation: vscode.Uri) {
        try {
            await git.fetch();
            await git.pull();
        } catch (e: any) {
            const message =
                "Failed to fetch addons! Please check your connection to GitHub.";
            localLogger.error(message, { report: false });
            localLogger.error(e, { report: false });
            WebVue.sendNotification({
                level: NotificationLevels.error,
                message,
            });
        }

        const ignoreList = [".DS_Store"];
        let addons = await filesystem.readDirectory(installLocation);
        if (addons) {
            addons = addons.filter((a) => !ignoreList.includes(a.name));
        }
        if (!addons) {
            localLogger.warn("No addons found in installation folder");
            return;
        }
        for (const addon of addons) {
            this.addons.set(addon.name, new Addon(addon.name, addon.uri));
            localLogger.verbose(`Found ${addon.name}`);
        }

        return await this.checkUpdated();
    }

    public async checkUpdated() {
        const diff = await git.diffSummary(["main", "origin/main"]);
        this.addons.forEach((addon) => {
            addon.checkForUpdate(diff.files as DiffResultTextFile[]);
        });
    }

    public unlockAddon(name: string) {
        const addon = this.addons.get(name);
        return addon?.setLock(false);
    }
}

export default new AddonManager();
