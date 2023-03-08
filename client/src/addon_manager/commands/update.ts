import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { git } from "../services/git.service";
import { DiffResultTextFile } from "simple-git";
import { WebVue } from "../panels/WebVue";
import { NotificationLevels } from "../types/webvue";
import { createChildLogger } from "../services/logging.service";

const localLogger = createChildLogger("Update Addon");

type Message = {
    data: {
        name: string;
    };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.addons.get(message.data.name);
    try {
        await addon.update();
    } catch (e) {
        const message = `Failed to update ${addon.name}`;
        localLogger.error(message, { report: false });
        localLogger.error(e, { report: false });
        WebVue.sendNotification({
            level: NotificationLevels.error,
            message,
        });
    }
    await addon.setLock(false);

    const diff = await git.diffSummary(["HEAD", "origin/main"]);
    addon.checkForUpdate(diff.files as DiffResultTextFile[]);
};
