import * as vscode from "vscode";

import { credentials } from "./authentication";
import { WebVue } from "./panels/WebVue";
import { ADDONS_DIRECTORY } from "./config";

/** Set up the addon manager by registering its commands and views in VS Code */
export async function activate(context: vscode.ExtensionContext) {
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("lua.addon_manager.open", () => {
            WebVue.render(context);
        })
    );

    // Create addons install directory if it does not already exist
    const extensionStorageURI = context.globalStorageUri;
    const addonDirectoryURI = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY
    );
    await vscode.workspace.fs.createDirectory(addonDirectoryURI);

    await credentials.initialize(context);
    credentials.login();
}
