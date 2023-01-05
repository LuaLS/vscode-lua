import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";
import { WebVue } from "../panels/WebVue";

const localLogger = createChildLogger("Uninstall Addon");

type Message = {
    data: {
        name: string;
    };
};

export default async (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.localAddons.get(message.data.name);
    addon.enabled = false;
    addonManager.uninstallAddon(message.data.name);
    localLogger.verbose(`Uninstalled "${message.data.name}"`);
    WebVue.sendMessage("removeLocalAddon", { name: message.data.name });
};
