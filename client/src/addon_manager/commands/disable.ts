import * as vscode from "vscode";
import { createChildLogger } from "../services/logging.service";
import addonManager from "../services/addonManager.service";

const localLogger = createChildLogger("Disable Addon");

type Message = {
    data: {
        name: string;
    };
};

export default (context: vscode.ExtensionContext, message: Message) => {
    const addon = addonManager.localAddons.get(message.data.name);
    addon.enabled = false;
    addon.sendToWebVue();
    localLogger.info(`Disabled "${message.data.name}" addon!`);
};
