import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { ADDONS_DIRECTORY } from "../config";
import { WebVue } from "../panels/WebVue";

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

    await localAddon.enable();
    await localAddon.sendToWebVue();

    WebVue.sendMessage("localAddonStore", {
        property: "total",
        value: addonManager.localAddons.size,
    });
    localLogger.info(`Installed ${message.data.name}`);
};
