import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { NotificationLevels } from "../types/webvue";
import { WebVue } from "../panels/WebVue";

const localLogger = createChildLogger("Set Version");

export default async (
    context: vscode.ExtensionContext,
    message: { data: { name: string; version: string } }
) => {
    const addon = addonManager.addons.get(message.data.name);

    try {
        if (message.data.version === "Latest") {
            await addon.update();

            const defaultBranch = await addon.getDefaultBranch();
            await addon.checkout(defaultBranch);
            await addon.pull();
        } else {
            await addon.checkout(message.data.version);
        }
    } catch (e) {
        localLogger.error(
            `Failed to checkout version ${message.data.version}: ${e}`
        );
        WebVue.sendNotification({
            level: NotificationLevels.error,
            message: `Failed to checkout version ${message.data.version}`,
        });
    }
};
