import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { createChildLogger } from "../services/logging.service";
import { setSetting } from "../services/settings.service";

type Message = {
    data: {
        name: string;
    };
};

const localLogger = createChildLogger("Disable Addon");

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.addons.get(message.data.name);
    const workspaceFolders = vscode.workspace.workspaceFolders;

    const folderOptions = await (
        await addon.getEnabled()
    )
        .filter((entry) => entry.enabled === true)
        .map((entry) => {
            return {
                label: entry.folder.name,
                detail: entry.folder.uri.path,
            };
        });

    try {
        if (workspaceFolders.length === 1) {
            await addon.disable(workspaceFolders[0]);
        } else {
            const targetFolders = await vscode.window.showQuickPick(
                folderOptions,
                {
                    canPickMany: true,
                    ignoreFocusOut: true,
                    title: `Disable ${addon.name} in which folders?`,
                }
            );
            if (!targetFolders) {
                localLogger.warn("User did not pick workspace folder");
                await addon.setLock(false);
                return;
            }
            for (const target of targetFolders) {
                const folder = workspaceFolders.find(
                    (folder) => folder.name === target.label
                );
                await addon.disable(folder);
                await setSetting(folder, "Lua.workspace.checkThirdParty", false);
            }
        }
    } catch (e) {
        localLogger.error(e);
        return;
    } finally {
        await addon.setLock(false);
    }
};
