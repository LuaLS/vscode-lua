import * as vscode from "vscode";
import { getConfig, setConfig } from "../../languageserver";
import { createChildLogger } from "./logging.service";
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

export const getLibraryPaths = async (): Promise<
    { folder: vscode.WorkspaceFolder; paths: string[] }[]
> => {
    const result = [];

    if (!vscode.workspace.workspaceFolders) return [];

    for (const folder of vscode.workspace.workspaceFolders) {
        const libraries = await getConfig(LIBRARY_SETTING, folder.uri);
        result.push({ folder, paths: libraries ?? [] });
    }

    return result;
};

export const applyAddonSettings = async (
    folder: vscode.WorkspaceFolder,
    config: Record<string, unknown>
) => {
    if (!folder) throw new ConfigError(`Workspace is not open!`);

    const changes = [];
    for (const [newKey, newValue] of Object.entries(config)) {
        if (Array.isArray(newValue)) {
            newValue.forEach((val) => {
                changes.push({
                    action: "add",
                    key: newKey,
                    value: val,
                    uri: folder.uri,
                });
            });
        } else if (typeof newValue === "object") {
            changes.push(
                ...Object.entries(newValue).map(([key, value]) => {
                    return {
                        action: "prop",
                        key: newKey,
                        prop: key,
                        value,
                        uri: folder.uri,
                    };
                })
            );
        } else {
            changes.push({
                action: "set",
                key: newKey,
                value: newValue,
                uri: folder.uri,
            });
        }
    }

    return await setConfig(changes);
};

export const revokeAddonSettings = async (
    folder: vscode.WorkspaceFolder,
    config: Record<string, unknown>
) => {
    if (!folder) throw new ConfigError(`Workspace is not open!`);

    const changes = [];
    for (const [newKey, newValue] of Object.entries(config)) {
        const currentValue = await getConfig(newKey, folder.uri);

        if (Array.isArray(newValue)) {
            // Only keep values that the addon settings does not contain
            const notAddon = currentValue.filter(
                (oldValue) => !newValue.includes(oldValue)
            );
            changes.push({
                action: "set",
                key: newKey,
                value: notAddon,
                uri: folder.uri,
            });
        } else if (typeof newValue === "object") {
            for (const objectKey of Object.keys(newValue)) {
                delete currentValue[objectKey];
            }
            // If object is now empty, delete it
            if (Object.keys(currentValue).length === 0) {
                changes.push({
                    action: "set",
                    key: newKey,
                    value: undefined,
                    uri: folder.uri,
                });
            } else {
                changes.push({
                    action: "set",
                    key: newKey,
                    value: currentValue,
                    uri: folder.uri,
                });
            }
        }
    }

    return await setConfig(changes);
};
