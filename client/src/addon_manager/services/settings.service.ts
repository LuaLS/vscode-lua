import * as vscode from "vscode";
import { createChildLogger } from "./logging.service";
import filesystem from "./filesystem.service";
import { LIBRARY_SETTING } from "../config";
import * as JSONC from "jsonc-parser";

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

/** Get the `.vscode/settings.json` file for a given workspace.
 * @param folder The workspace to get the setting file for
 */
export const getSettingsFile = async (
    folder: vscode.WorkspaceFolder
): Promise<Record<string, unknown>> => {
    const settingFileUri = vscode.Uri.joinPath(
        folder.uri,
        ".vscode",
        "settings.json"
    );

    let rawSettings = await filesystem.readFile(settingFileUri);
    if (!rawSettings) {
        localLogger.warn(
            `Could not get settings file for ${folder.name} folder, falling back to no settings`
        );
        rawSettings = "{}";
    }

    try {
        return JSONC.parse(rawSettings, null, {
            allowTrailingComma: true,
            allowEmptyContent: true,
        });
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
export const getSetting = async (
    name: string,
    folder: vscode.WorkspaceFolder
): Promise<unknown> => {
    const workspaceSettings = await getSettingsFile(folder);
    return workspaceSettings[name] ?? [];
};

/** Set a setting in this workspace's `.vscode/settings.json` file.
 * @param name The name of the setting, e.g. `Lua.runtime.version`.
 * @param value The value of the setting.
 * @throws If a workspace is not open
 */
export const setSetting = async (
    folder: vscode.WorkspaceFolder,
    name: string,
    value: unknown
) => {
    if (!folder) throw new ConfigError("Workspace is not open!");

    const workspaceConfiguration = vscode.workspace.getConfiguration(
        null,
        folder
    );
    return workspaceConfiguration.update(name, value).then(
        () => {
            localLogger.debug(`Successfully set "${name}" to \`${value}\``);
        },
        () => {
            localLogger.warn(`Failed to set "${name}" to \`${value}\``);
        }
    );
};

export type WorkspaceLibrary = {
    folder: vscode.WorkspaceFolder;
    paths?: string[];
};

export const getLibraryPaths = async () => {
    const folders: WorkspaceLibrary[] = [];

    for (const folder of vscode.workspace.workspaceFolders) {
        folders.push({
            folder,
            paths: (await getSetting(LIBRARY_SETTING, folder)) as string[] | undefined,
        });
    }

    return folders;
};

export const applyAddonSettings = async (
    folder: vscode.WorkspaceFolder,
    config: Record<string, unknown>
) => {
    if (!folder) throw new ConfigError(`Workspace is not open!`);

    const settings = await getSettingsFile(folder);

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

        promises.push(setSetting(folder, newKey, settings[newKey]));
    }

    return Promise.all(promises);
};

export const revokeAddonSettings = async (
    folder: vscode.WorkspaceFolder,
    config: Record<string, unknown>
) => {
    if (!folder) throw new ConfigError(`Workspace is not open!`);

    const settings = await getSettingsFile(folder);

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

        promises.push(setSetting(folder, newKey, settings[newKey]));
    }

    return Promise.all(promises);
};
