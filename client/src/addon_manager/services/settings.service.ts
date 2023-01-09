import * as vscode from "vscode";
import { createChildLogger } from "./logging.service";
import filesystem from "./filesystem.service";
import { LIBRARY_SETTING } from "../config";
import { LoggableError } from "./logging/LoggableError";

const localLogger = createChildLogger("Settings");

/** Get the "active" workspace.
 *
 * All workspace folders in the current workspace are
 * [technically always "active"](https://code.visualstudio.com/api/references/vscode-api#WorkspaceFolder),
 * however, getting the first workspace [*should*](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration) be the root workspace.
 */
export const getWorkspace = () => vscode.workspace.workspaceFolders?.[0];

/** Get the `.vscode/settings.json` file for a given workspace.
 * @param workspace The workspace to get the setting file for
 */
export const getWorkspaceSettingsFile = async (
    workspace: vscode.WorkspaceFolder
): Promise<Record<string, unknown>> => {
    const settingFileUri = vscode.Uri.joinPath(
        workspace.uri,
        ".vscode",
        "settings.json"
    );

    return JSON.parse(await filesystem.readFile(settingFileUri));
};

/** Get a setting from the workspace's `.vscode/settings.json` file.
 * @param name The name of the setting, e.g. `Lua.runtime.version`.
 * @throws If a workspace is not open
 */
export const getSetting = async (name: string): Promise<unknown> => {
    const workspace = getWorkspace();
    if (!workspace)
        throw new LoggableError("Workspace is not open", localLogger);

    const workspaceSettings = await getWorkspaceSettingsFile(workspace);
    return workspaceSettings[name];
};

/** Set a setting in this workspace's `.vscode/settings.json` file.
 * @param name The name of the setting, e.g. `Lua.runtime.version`.
 * @param value The value of the setting.
 * @throws If a workspace is not open
 */
export const setSetting = async (name: string, value: unknown) => {
    const workspace = getWorkspace();
    if (!workspace)
        throw new LoggableError("Workspace is not open!", localLogger);

    const workspaceConfiguration = vscode.workspace.getConfiguration(
        null,
        workspace
    );
    return workspaceConfiguration.update(name, value);
};

/** Get the enabled libraries in the current workspace. */
export const getLibraries = async (): Promise<string[]> => {
    const settingValue = await getSetting(LIBRARY_SETTING);

    if (!Array.isArray(settingValue))
        throw new LoggableError(
            `"${LIBRARY_SETTING}" setting in workspace is not an array`,
            localLogger
        );

    return settingValue;
};
