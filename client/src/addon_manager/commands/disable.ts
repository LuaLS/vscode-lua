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

const localLogger = createChildLogger("Disable Addon");

type Message = {
    name: string;
};

export default (
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    data: Message
) => {
    // Get the currently enabled addons
    const enabledLibraries = getEnabledLibraries();
    const enabledAddons = getEnabledAddons();

    // The index of the addon in `enabledLibraries`
    const index = enabledAddons[data.name];
    // Add path to target addon to enabled libraries list
    if (index === undefined) {
        localLogger.info(`${data.name} addon is not enabled`);
        return;
    }

    enabledLibraries.splice(index, 1);

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

    localLogger.info(`Disabled "${data.name}" addon!`);
    getInstalled(context, webview);
};
