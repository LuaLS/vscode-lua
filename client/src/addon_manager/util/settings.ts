import * as vscode from "vscode";
import { createChildLogger } from "../../services/logging.service";

const localLogger = createChildLogger("Settings");

/** Get the "active" workspace.
 *
 * All workspace folders in the current workspace are
 * [technically always "active"](https://code.visualstudio.com/api/references/vscode-api#WorkspaceFolder),
 * however, getting the first workspace [*should*](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration) be the root workspace.
 */
export const getWorkspace = () => vscode.workspace.workspaceFolders?.[0];

/** Get a setting from the current workspace.
 * @param name The name of the setting to get.
 * @param section The section that the setting lives in. Will default to "Lua". Example: `Lua.workspace`.
 * @param defaultValue A value to fall back to should the setting not exist.
 * @throws If there is no workspace open
 */
export const getSetting = (
    name: string,
    section = "Lua",
    defaultValue?: any
) => {
    // Get current user config for "primary" workspace
    const initialWorkspace = getWorkspace();

    if (!initialWorkspace) {
        throw "There is no workspace open";
    }

    const config = vscode.workspace.getConfiguration(section, initialWorkspace);

    const value = config.get(name);
    localLogger.debug(`${section}.${name} = ${value ?? "undefined"}`);

    return value ?? defaultValue;
};

/** Set a setting from the current workspace.
 * @param name The name of the setting to set.
 * @param section The section that the setting lives in. Will default to "Lua". Example: `Lua.workspace`.
 * @param value The value to set for the setting.
 * @throws If there is no workspace open
 */
export const setSetting = (name: string, section = "Lua", value: any) => {
    const initialWorkspace = getWorkspace();

    if (!initialWorkspace) {
        throw "There is no workspace open";
    }

    const workspaceConfig = vscode.workspace.getConfiguration(
        section,
        initialWorkspace
    );

    workspaceConfig.update(name, value, vscode.ConfigurationTarget.Workspace);

    localLogger.debug(`Set ${section}.${name} to ${value}`);
};

/** Request that the user open a folder/workspace */
export const requestOpenFolder = () => {
    return vscode.window
        .showInformationMessage(
            "There is no workspace currently open",
            "Open Folder"
        )
        .then((result) => {
            if (!result) return;
            vscode.commands.executeCommand("workbench.action.files.openFolder");
        });
};
