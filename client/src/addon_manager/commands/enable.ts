import * as vscode from "vscode";
import { createChildLogger } from "../../services/logging.service";
import {
    ADDONS_DIRECTORY,
    LIBRARY_SETTING_NAME,
    LIBRARY_SETTING_SECTION,
} from "../config";
import getInstalled from "./getInstalled";
import { getSetting, setSetting } from "../util/settings";
import { getEnabledAddons, getEnabledLibraries } from "../util/addon";

const localLogger = createChildLogger("Enable Addon");

type Message = {
    name: string;
};

export default (
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    data: Message
) => {
    const extensionStorageURI = context.globalStorageUri;
    const addonDirectoryURI = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY,
        data.name,
        "library"
    );

    // Get the currently enabled libraries
    const enabledLibraries = getEnabledLibraries();
    const enabledAddons = getEnabledAddons();

    // NOTE: For some reason, if the path has a leading slash, the libraries
    // are not loaded. The following trims the leading slash off.
    const fsPath = addonDirectoryURI.path.substring(1);

    // Add path to target addon to enabled libraries list
    if (enabledAddons[data.name] !== undefined) {
        localLogger.warn(`${data.name} addon is already enabled`);
        return;
    }
    enabledLibraries.push(fsPath);

    // Update the user's workspace settings to include the new addon
    try {
        setSetting(
            LIBRARY_SETTING_NAME,
            LIBRARY_SETTING_SECTION,
            enabledLibraries
        );
    } catch (e) {
        vscode.window
            .showInformationMessage(e, "Open Folder")
            .then((result) => {
                if (!result) return;
                vscode.commands.executeCommand(
                    "workbench.action.files.openFolder"
                );
            });
        return;
    }

    localLogger.info(`Enabled "${data.name}" addon!`);
    getInstalled(context, webview);
};
