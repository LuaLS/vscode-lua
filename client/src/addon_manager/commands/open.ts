import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import { ADDONS_DIRECTORY } from "../config";

const localLogger = createChildLogger("Open Addon");

export default async (
    context: vscode.ExtensionContext,
    message: { data: { name: string } }
) => {
    const extensionStorageURI = context.globalStorageUri;
    const uri = vscode.Uri.joinPath(
        extensionStorageURI,
        "addonManager",
        ADDONS_DIRECTORY,
        message.data.name
    );

    localLogger.info(`Opening "${message.data.name}" addon in file explorer`);
    vscode.env.openExternal(vscode.Uri.file(uri.fsPath));
};
