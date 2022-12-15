import * as vscode from "vscode";
import { commands } from ".";
import { logger } from "../../logger";
import { ADDONS_DIRECTORY } from "../config";

type Message = {
    command: "uninstall";
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
    vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true }).then(
        () => {
            logger.info(`Successfully deleted ${data.name}`);
        },
        (err) => {
            logger.error(`Failed to delete "${data.name} addon (${err})"`);
        }
    );

    commands.getInstalled(context, webview);
};
