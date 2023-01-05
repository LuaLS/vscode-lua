import * as vscode from "vscode";

import { credentials } from "./services/authentication.service";
import { WebVue } from "./panels/WebVue";
import { ADDONS_DIRECTORY } from "./config";
import filesystem from "./services/filesystem.service";
import VSCodeLogFileTransport from "./services/logging/vsCodeLogFileTransport";

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
    await filesystem.createDirectory(addonDirectoryURI);

    await credentials.initialize(context);
    credentials.login();
}
