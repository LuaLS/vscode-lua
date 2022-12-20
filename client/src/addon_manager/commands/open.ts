import * as vscode from "vscode";
import { createChildLogger } from "../../services/logging.service";
import { ADDONS_DIRECTORY } from "../config";

const localLogger = createChildLogger("Open Addon");

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

    localLogger.info(`Opening ${data.name} addon in file explorer`);
    vscode.env.openExternal(vscode.Uri.file(uri.fsPath));
};
