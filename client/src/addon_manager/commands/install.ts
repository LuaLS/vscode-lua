import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { ADDONS_DIRECTORY } from "../config";

const localLogger = createChildLogger("Install Addon");

type Message = {
    data: {
        name: string;
    };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    const installLocation = vscode.Uri.joinPath(
        context.globalStorageUri,
        ADDONS_DIRECTORY
    );

    const localAddon = await addonManager.installAddon(
        message.data.name,
        installLocation
    );
    localAddon.enabled = true;
    await localAddon.sendToWebVue();
    localLogger.info(`Installed ${message.data.name}`);
};
