import * as vscode from "vscode";
import { getSetting } from "./settings";
import { LIBRARY_SETTING_NAME, LIBRARY_SETTING_SECTION } from "../config";

const ADDON_REGEX = new RegExp(/sumneko\.lua\/addons\/([^\/]+)\/library/);

/** Get the currently enabled libraries */
export const getEnabledLibraries = () => {
    try {
        return getSetting(LIBRARY_SETTING_NAME, LIBRARY_SETTING_SECTION, []) as string[];
    } catch (e) {
        vscode.window
            .showInformationMessage(e, "Open Folder")
            .then((result) => {
                if (!result) return;
                vscode.commands.executeCommand(
                    "workbench.action.files.openFolder"
                );
            });
        throw e;
    }
};

/** Get the currently enabled addons */
export const getEnabledAddons = (): { [index: string]: number } => {
    const enabledLibraries = getEnabledLibraries() as string[];
    const enabledAddons = {};
    enabledLibraries.map((path, index) => {
        const match = ADDON_REGEX.exec(path);
        const addonName = match[1];
        if (!match[0]) return;
        enabledAddons[addonName] = index;
    });
    return enabledAddons;
};
