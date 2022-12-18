import * as vscode from "vscode";
import getInstalled from "./getInstalled";
import { createChildLogger } from "../../services/logging.service";
import { ADDONS_DIRECTORY } from "../config";
import { getEnabledAddons, getEnabledLibraries } from "../util/addon";

const localLogger = createChildLogger("Uninstall Addon");

type Message = {
    name: string;
};

export default async (
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    data: Message
) => {
    const extensionStorageURI = context.globalStorageUri;
    const uri = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY,
        data.name
    );

    // If it is currently enabled, disable it
    const enabledLibraries = getEnabledLibraries();
    const enabledAddons = getEnabledAddons();

    /** Index of target addon in `enabledLibraries` */
    const index = enabledAddons[data.name];
    if (index !== undefined) enabledLibraries.splice(index, 1);

    return vscode.workspace.fs
        .delete(uri, { recursive: true, useTrash: true })
        .then(
            () => {
                localLogger.info(`Successfully uninstalled ${data.name}`);
                getInstalled(context, webview);
            },
            (err) => {
                localLogger.error(
                    `Failed to uninstall "${data.name} addon (${err})"`
                );
            }
        );
};
