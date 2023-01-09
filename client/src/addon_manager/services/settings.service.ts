import * as vscode from "vscode";
import { createChildLogger } from "./logging.service";
import filesystem from "./filesystem.service";
import { LIBRARY_SETTING } from "../config";

const localLogger = createChildLogger("Settings");

/** An error with the user's configuration `.vscode/settings.json` or an
 * addon's `config.json`. */
class ConfigError extends Error {
    message: string;

    constructor(message: string) {
        super(message);
        localLogger.error(message);
    }
}

/** Get the "active" workspace.
 *
 * All workspace folders in the current workspace are [technically always
 * "active"](https://code.visualstudio.com/api/references/vscode-api#WorkspaceFolder),
 * however, getting the first workspace
 * [*should*](https://code.visualstudio.com/api/references/vscode-api#WorkspaceConfiguration)
 * be the root workspace.
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

    let rawSettings = await filesystem.readFile(settingFileUri);
    if (rawSettings === "") {
        rawSettings = "{}";
    }

    try {
        return JSON.parse(rawSettings);
    } catch (e) {
        const relativePath = vscode.workspace.asRelativePath(settingFileUri);
        localLogger.warn(
            `Failed to parse workspace settings file (${relativePath}) (${e})`
        );
        throw e;
    }
};

/** Get a setting from the workspace's `.vscode/settings.json` file.
 * @param name The name of the setting, e.g. `Lua.runtime.version`.
 * @throws If a workspace is not open
 */
export const getSetting = async (name: string): Promise<unknown> => {
    const workspace = getWorkspace();
    if (!workspace) throw new ConfigError("Workspace is not open");

    try {
        const workspaceSettings = await getWorkspaceSettingsFile(workspace);
        return workspaceSettings[name];
    } catch (e) {
        return undefined;
    }
};

/** Set a setting in this workspace's `.vscode/settings.json` file.
 * @param name The name of the setting, e.g. `Lua.runtime.version`.
 * @param value The value of the setting.
 * @throws If a workspace is not open
 */
export const setSetting = async (name: string, value: unknown) => {
    const workspace = getWorkspace();
    if (!workspace) throw new ConfigError("Workspace is not open!");

    const workspaceConfiguration = vscode.workspace.getConfiguration(
        null,
        workspace
    );
    return workspaceConfiguration.update(name, value).then(
        () => {
            localLogger.debug(`successfully set "${name}" to ${value}`);
        },
        () => {
            localLogger.warn(`Failed to set "${name}" to ${value}`);
        }
    );
};

/** Get the enabled libraries in the current workspace. */
export const getLibraries = async (): Promise<string[]> => {
    const settingValue = await getSetting(LIBRARY_SETTING);

    if (settingValue === undefined) return [];

    if (!Array.isArray(settingValue))
        throw new ConfigError(
            `"${LIBRARY_SETTING}" setting in workspace is not an array`
        );

    return settingValue;
};

export const applyAddonSettings = async (config: Record<string, unknown>) => {
    const workspace = getWorkspace();
    if (!workspace) throw new ConfigError(`Workspace is not open!`);

    const settings = await getWorkspaceSettingsFile(workspace);

    const promises = [];
    for (const [newKey, newValue] of Object.entries(config)) {
        const oldValue = settings[newKey];

        // If current setting is an array, push new values
        // If current setting is an object, add new pairs
        // Else set current setting to new value

        if (Array.isArray(oldValue)) {
            if (!Array.isArray(newValue)) {
                localLogger.warn(`"${newKey}" is not an Array!`);
                continue;
            }
            // Add newValue array values that are not already present
            const unique = newValue.filter((v) => !oldValue.includes(v));
            oldValue.push(...unique);
        } else if (typeof oldValue === "object") {
            if (typeof newValue !== "object") {
                localLogger.warn(`"${newKey}" is not an Object!`);
                continue;
            }
            for (const [key, value] of Object.entries(newValue)) {
                localLogger.info(`${key}: ${value}`);
                oldValue[key] = value;
            }
        } else {
            settings[newKey] = newValue;
        }

        promises.push(setSetting(newKey, settings[newKey]));
    }

    return Promise.all(promises);
};

export const revokeAddonSettings = async (config: Record<string, unknown>) => {
    const workspace = getWorkspace();
    if (!workspace) throw new ConfigError(`Workspace is not open!`);

    const settings = await getWorkspaceSettingsFile(workspace);

    const promises = [];
    for (const [newKey, newValue] of Object.entries(config)) {
        const currentValue = settings[newKey];

        // If target setting is an array, splice addon values
        // If target setting is an object, delete addon pairs

        if (Array.isArray(currentValue)) {
            if (!Array.isArray(newValue)) {
                localLogger.warn(`"${newKey}" is not an Array!`);
                continue;
            }
            // Only keep values that the addon settings does not contain
            const notAddon = currentValue.filter(
                (oldValue) => !newValue.includes(oldValue)
            );
            // If array only has items from addon settings, delete it
            if (notAddon.length === 0) {
                settings[newKey] = undefined;
            } else {
                settings[newKey] = notAddon;
            }
        } else if (typeof currentValue === "object") {
            if (typeof newValue !== "object") {
                localLogger.warn(`"${newKey}" is not an Object!`);
                continue;
            }
            for (const objectKey of Object.keys(newValue)) {
                delete currentValue[objectKey];
            }
            // If object is now empty, delete it
            if (Object.keys(currentValue).length === 0) {
                settings[newKey] = undefined;
            }
        }

        promises.push(setSetting(newKey, settings[newKey]));
    }

    return Promise.all(promises);
};
