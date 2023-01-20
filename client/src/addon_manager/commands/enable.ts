import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { createChildLogger } from "../services/logging.service";

type Message = {
    data: {
        name: string;
    };
};

const localLogger = createChildLogger("Enable Addon");

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.addons.get(message.data.name);
    const workspaceFolders = vscode.workspace.workspaceFolders;

    const folderOptions = await (
        await addon.getEnabled()
    )
        .filter((entry) => entry.enabled === false)
        .map((entry) => {
            return {
                label: entry.folder.name,
                detail: entry.folder.uri.path,
            };
        });

    try {
        if (workspaceFolders.length === 1) {
            await addon.enable(workspaceFolders[0]);
        } else {
            const targetFolders = await vscode.window.showQuickPick(
                folderOptions,
                {
                    canPickMany: true,
                    ignoreFocusOut: true,
                    title: `Enable ${addon.name} in which folders?`,
                }
            );
            if (!targetFolders) {
                localLogger.warn("User did not pick workspace folder");
                await addon.setLock(false);
                return;
            }
            for (const target of targetFolders) {
                await addon.enable(
                    workspaceFolders.find(
                        (folder) => folder.name === target.label
                    )
                );
            }
        }
    } catch (e) {
        localLogger.error(e);
        return;
    } finally {
        await addon.setLock(false);
    }
};
