import * as vscode from "vscode";
import addonManager from "../services/addonManager.service";
import { createChildLogger } from "../services/logging.service";
import { setConfig } from "../../languageserver";

type Message = {
    data: {
        name: string;
    };
};

const localLogger = createChildLogger("Enable Addon");

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.addons.get(message.data.name);
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let selectedFolders: vscode.WorkspaceFolder[];

    if (workspaceFolders.length === 1) {
        selectedFolders = [workspaceFolders[0]];
    } else {
        const folderOptions = await addon.getQuickPickerOptions(false);

        const pickResult = await vscode.window.showQuickPick(folderOptions, {
            canPickMany: true,
            ignoreFocusOut: true,
            title: `Enable ${addon.name} in which folders?`,
        });
        if (!pickResult) {
            localLogger.warn("User did not pick workspace folder");
            await addon.setLock(false);
            return;
        }
        selectedFolders = pickResult.map((selection) => {
            return workspaceFolders.find(
                (folder) => folder.name === selection.label
            );
        });
    }

    for (const folder of selectedFolders) {
        await addon.enable(folder);
        await setConfig([
            {
                action: "set",
                key: "Lua.workspace.checkThirdParty",
                value: false,
                uri: folder.uri,
            },
        ]);
    }

    return addon.setLock(false);
};
